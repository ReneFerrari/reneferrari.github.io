---
layout: post
title:  "[WIP] Collection Operations 🔧"
date:   2019-08-11
excerpt: "A basic overview of collection operations existing in the kotlin stdlib."
---
## Transforming
### Map
The `map` operation is definitely one of the most used and well known ones. It simply applies
a transformation to each element of a collection. A very basic example would be:

{% highlight kotlin %}
data class Person(val firstName: String, val lastName: String)
val people = listOf(Person("John", "Doe"), Person("Janet", "Dont"))

val fullNames = people.map { person ->
    "${person.firstName} ${person.lastName}"
}

//fullNames will print: [John Doe, Janet Dont]
{% endhighlight %}

All `Person` items in the list will be transformed to a `String`  which consists of
the firstname concatenated with the lastname of the person.

If your collection contains nullable items which can be omitted, you should use `mapNotNull`
instead, so you avoid checks for optionals. Note that pretty much all operations also offer a `indexed` version which will
give you the corresponding index to each item.

### Flatten
`Flatten` can only be applied to nested collections. It will "flatten" out the collection (removing the nesting).
An example will clear things up easily:

{% highlight kotlin %}
data class Person(val firstName: String, val lastName: String)

val peopleStartingWithR = listOf(Person("Rick", "Sanchez"), Person("Rudolph", "Reindeer"))
val peopleStartingWithJ = listOf(Person("John", "Doe"), Person("Janet", "Dont"))
val allPeople = listOf(peopleStartingWithJ, peopleStartingWithR)

val flattedList = allPeople.flatten()

//flattedList will print: [Person(firstName=John, lastName=Doe), Person(firstName=Janet, lastName=Dont), Person(firstName=Rick, lastName=Sanchez), Person(firstName=Rudolph, lastName=Reindeer)]
{% endhighlight %}

Basically the `List<List<Person>>` is transformed to `List<Person>`. 

### FlatMap
Now lets talk about `flatMap`. It is very easy to understand if you deconstruct it.
The name consists of `flat(ten)` and `map`, which have already been covered. This may let you assume that `flatten` happens first, but that is not the case. First will be mapped then flattened. Important: `flatMap` is implemented more efficently than just calling `map().flatten()`.

{% highlight kotlin %}
data class Person(val firstName: String, val lastName: String)

val peopleStartingWithR = listOf(Person("Rick", "Sanchez"), Person("Rudolph", "Reindeer"))
val peopleStartingWithJ = listOf(Person("John", "Doe"), Person("Janet", "Dont"))
val allPeople = listOf(peopleStartingWithJ, peopleStartingWithR)

val fullNames = allPeople.flatMap { people ->
    people.map { person -> "${person.firstName} ${person.lastName}" }
}
//fullNames will print: [John Doe, Janet Dont, Rick Sanchez, Rudolph Reindeer]
{% endhighlight %}

The same can be rewritten like:
{% highlight kotlin %}
val fullNames = allPeople.map { people ->
    people.map { person -> "${person.firstName} ${person.lastName}" }
}.flatten()
{% endhighlight %}

As mentioned previously, this would be less efficent than using `flatMap`. If you can't wrap your head around it:
- A List<List<Person>> called allPeople is created
- Map is called (item is a List<Person>)
- On this item (List<Person>) map is called again (now we can access each person)
- Now first and lastname are concatenated
- After mapping all this, the List<List<String>> is flattened to a List<String>

### Zip
Zip simply creates Pairs from the elements at the same positon of two collections. This is done until the end of a collection is reached (so if collection A has 5 elements and collection B only 3, zip will generate 3 Pairs). In practice this would look like this (note that zip can be used with the infix notation):

{% highlight kotlin %}
val firstNames = listOf("Rick", "Rudolph")
val lastNames = listOf("Sanchez", "Reindeer", "Ignored")

val fullNames = firstNames zip lastNames
val (unzippedfirstNames, unzippedLastNames) = fullNames.unzip()

//fullNames: [(Rick, Sanchez), (Rudolph, Reindeer)]
//unzippedFirstNames: [Rick, Rudolph]
//unzippedLastNames: [Sanchez, Reindeer]
{% endhighlight %}

Unzip does the inverse of zip (collection of pairs will be split up into two collections).

## Filtering
### Filter
`filter` comes into many different flavours. The most basic one is filter by a certain predicate.
Here is an example for it:

{% highlight kotlin %}
val numbers = (0..10).toList()

val filteredNumbers = numbers.filter { number -> number > 5 }

//filteredNumbers: [6, 7, 8, 9, 10]
{% endhighlight %}

There is also `filterNotNull` which returns all elements which are not null, `filterNot` which returns all elements that
are not matching your predicate and `filterIsInstance` which will let you filter by the given type.

### Partition
Partition will give you the matching and nonmatching items each in a seperate list. Example:

{% highlight kotlin %}
val numbers = (0..10).toList()

val (matching, notMatching) = numbers.partition { number -> number > 5 }

//matching: [6, 7, 8, 9, 10]
//notMatching: [0, 1, 2, 3, 4, 5]
{% endhighlight %}

### All, any, none
All will be true if all elements match the predicate OR the collection is empty. Any will return true if at least one element matches
the predicate. Hence, none will return true if no element matches the predicate.

Furthermore any and none can be used without a predicate. In this case any will return true if the collection has elements. On the other hand,
none will return true if the collection has no elements.