---
title: "Why I Moved from MVVM to Redux-Style MVVM on a 4M+ Download App"
description: "A real-world look at why pure MVVM starts to crack at scale, and how introducing a Redux-style unidirectional data flow transformed our codebase at Tractive."
date: 2025-01-15
tags: ["Android", "Architecture", "MVVM"]
readTime: "6 min read"
---

At Tractive, we track millions of pets in real time. Our Android app — with 4M+ downloads — has grown far beyond what early architectural decisions anticipated. This is the story of why we moved from pure MVVM to a Redux-style unidirectional data flow, and why I think every medium-to-large Android team should consider it.

## The Problem with Pure MVVM at Scale

Pure MVVM works beautifully when your ViewModel manages a handful of state properties. But as features grow, the cracks appear fast.

In our map screen — the core of Tractive — the ViewModel was managing dozens of `StateFlow` and `LiveData` properties: pet location, connection status, loading states, error states, filter selections, path history, and zone alerts. Each property changed independently. If the connection dropped *while* the map was loading *while* the user had filters applied — debugging the resulting UI inconsistency was genuinely painful.

The root problem is that **state is scattered**. Multiple sources of truth compete silently, and reasoning about which combination of flags produces which UI outcome becomes exponentially harder with every new feature.

## What "Redux-Style MVVM" Actually Means

Redux-style MVVM borrows the key insight from Redux: your entire UI state lives in a **single, immutable data class**. Changes happen through a *reducer* — a pure function that takes the current state and an action, and returns the next state.

No side effects in the reducer. No async calls. Just: given *this* state and *this* action, what is the new state?

```kotlin
// Single source of truth for the entire screen
data class MapUiState(
    val isLoading: Boolean = false,
    val petLocation: LatLng? = null,
    val isConnected: Boolean = true,
    val errorMessage: String? = null,
    val activeFilters: Set<FilterType> = emptySet(),
    val pathHistory: List<LatLng> = emptyList()
)

// Every possible user or system event
sealed interface MapAction {
    data class LocationUpdated(val location: LatLng) : MapAction
    data class PathReceived(val path: List<LatLng>) : MapAction
    data object ConnectionLost : MapAction
    data object ConnectionRestored : MapAction
    data class FilterToggled(val filter: FilterType) : MapAction
    data class ErrorOccurred(val message: String) : MapAction
    data object LoadingStarted : MapAction
    data object Dismissed : MapAction
}

// The ViewModel: clean, testable, declarative
class MapViewModel @Inject constructor(
    private val locationRepository: LocationRepository
) : ViewModel() {

    private val _state = MutableStateFlow(MapUiState())
    val state: StateFlow<MapUiState> = _state.asStateFlow()

    fun dispatch(action: MapAction) {
        _state.update { currentState -> reduce(currentState, action) }
    }

    private fun reduce(state: MapUiState, action: MapAction): MapUiState = when (action) {
        is MapAction.LocationUpdated -> state.copy(
            petLocation = action.location,
            isLoading = false,
            errorMessage = null
        )
        is MapAction.PathReceived -> state.copy(pathHistory = action.path)
        MapAction.ConnectionLost -> state.copy(
            isConnected = false,
            errorMessage = "Connection lost. Retrying…"
        )
        MapAction.ConnectionRestored -> state.copy(
            isConnected = true,
            errorMessage = null
        )
        is MapAction.FilterToggled -> state.copy(
            activeFilters = if (action.filter in state.activeFilters)
                state.activeFilters - action.filter
            else
                state.activeFilters + action.filter
        )
        is MapAction.ErrorOccurred -> state.copy(
            errorMessage = action.message,
            isLoading = false
        )
        MapAction.LoadingStarted -> state.copy(isLoading = true, errorMessage = null)
        MapAction.Dismissed -> state.copy(errorMessage = null)
    }

    fun observeLocation() {
        viewModelScope.launch {
            locationRepository.locationFlow.collect { location ->
                dispatch(MapAction.LocationUpdated(location))
            }
        }
    }
}
```

The reducer is a pure function — no coroutines, no dependencies, no mocking needed. State transitions are explicit and exhaustive. The `when` expression won't compile if you forget a branch.

## What We Gained

**Predictability.** Every state transition is named and intentional. When a bug appears, you look at which `dispatch()` call caused it — there's nowhere else to hide.

**Testability.** Testing a reducer is just calling a function. There's no `TestCoroutineDispatcher`, no `InstantTaskExecutorRule`, and no mocking a `LiveData` observer. You pass in state + action, you assert the output. Our ViewModel test coverage went from near-zero to comprehensive in a matter of weeks after the migration.

**Onboarding speed.** A new teammate can read the `MapUiState` class and immediately understand every piece of data the screen can show. Reading the `MapAction` sealed interface tells them every possible user interaction and system event. The entire mental model fits in two files.

**Compose synergy.** A single `StateFlow<UiState>` collected with `collectAsStateWithLifecycle()` is idiomatic Compose. One recomposition surface, one truth. No `derivedStateOf` gymnastics to reconcile competing `State<T>` objects.

## The Trade-offs

It's not free. Upfront boilerplate is higher — you're defining sealed classes, data classes, and a reducer where before you'd call `_isLoading.value = true`. Some engineers push back initially, especially if they're used to the simplicity of two-line property mutations.

Side effects — navigation events, analytics calls, network requests — also need a separate channel. We use a `SharedFlow<Effect>` alongside the state for one-shot events that shouldn't survive rotation.

And for trivially simple screens, it's overkill. A settings screen with two toggles doesn't need a reducer.

## Should You Do This?

If your ViewModel has more than five or six independent state properties, and your feature involves complex interactions between them — yes. Start the migration. You don't need an MVI library. The pattern above, built on Kotlin sealed classes and `StateFlow`, is enough.

At Tractive, this shift changed more than just our code. It changed how we write tickets, review PRs, and talk about features in planning sessions. When every state transition has a name, conversations get sharper. That precision compounds across a team. That's worth more than the pattern itself.
