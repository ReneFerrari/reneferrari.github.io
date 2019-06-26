---
layout: post
title:  "[WIP] A closer look at ranges in Kotlin"
date:   2016-06-26
excerpt: "Why to use them, why they are efficent, how they are implemented."
---
## Basics
In simple terms, a range consists of all the numbers which exist in a certain ordered closed interval (inclusively defined by a lower and an upper bound value).
They are a very nice feature of the language and efficent in its use. If you are unfamiliar with ranges but already have a foundational knowledge of Kotlin you 
may have already encountered them:

{% highlight kotlin %}
for (i in 1..10) {
    println(i)
}
{% endhighlight %}

Behind `1..10` lies an `IntRange` which is created from the invocation of `rangeTo()` (you can check this by going to the definition of the dots between 1 and 10).
As I have mentioned previously ranges are inclusive therefore the for loop is equivalent to: `i >= 1 && i <= 10`.

If you need to iterate reversed (greater lower bound than upper bound) you can't use the `..` but instead have to rely on `downTo`:

{% highlight kotlin %}
for (i in 10 downTo 1) {
    println(i)
}
{% endhighlight %}

This for loop is equivalent to `i <= 10 && i >= 1`.

Another feature of ranges is defining a custom `step` (it is 1 by default).

{% highlight kotlin %}
for (i in 2..10 step 2) {
    println(i)
}
{% endhighlight %}

Now this will only print equal numbers from 2 to 10 inclusively.

Sometimes you may need to exclude the upper bound of the range when it is defined by the size of a list. Instead of writing `0..(list.size - 1)`
you can write `0 until list.size` which looks way cleaner. Lastly, if you want to check if a certain value is inside a range you can do that with
the `in` operator like `5 in 1..10`.

## Digging deeper
In the previous chapter I have already covered some functionality of ranges but not all of it. When taking a look at the [content of kotlin.ranges](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.ranges/index.html)
you can see it also contains the following functions (not mentioned yet):
{% highlight kotlin %}
val someNumber = 67
val foo = 50

println(foo.coerceAtLeast(someNumber))
println(foo.coerceAtMost(someNumber))
println(foo.coerceIn(0..someNumber))
{% endhighlight %}

This will print `67 50 50`. Explanation:
- `coerceAtLeast` will return at least the value of the passed argument. Since 67 is greater than 50 67 is returned
- `coerceAtMost` will return at most the value of the passed argument. In our case 67 is less than 50 so 50 is returned
- `coerceIn` will return a value inside the range passed as argument of the function. In our case the foo is inside the range so the value of foo (50) is returned.
If foo was -1, 0 (the lower bound of the range) would be returned - similarily if foo was 68, 67 (the upper bound) would be returned.


{% highlight kotlin %}
print((0..100).random())
{% endhighlight %}

Random - you guessed it - simply creates a random value from a given range. 

{% highlight kotlin %}
for (i in (1..10).reversed()) {
    println(i)
}
{% endhighlight %}

Basically the same as `10 downTo 1` (using `downTo` is preferred).

{% highlight kotlin %}
println((0..10).contains(5))
{% endhighlight %}

Same as `5 in 0..10` (using `in` is preferred).

## Implementation

### Integer Types
You probably wonder how all of this works. You may believe that a list holding all the values is generated upon initializing a range. Luckily that's not the 
case - this would eat up memory needlessly. 

Now let's take a look at the implementation (stripped down -> I removed hashCode, toString and equals so only important functions show):

{% highlight kotlin %}
public class IntRange(start: Int, endInclusive: Int) : IntProgression(start, endInclusive, 1), ClosedRange<Int> {
    override val start: Int get() = first
    override val endInclusive: Int get() = last

    override fun contains(value: Int): Boolean = first <= value && value <= last

    override fun isEmpty(): Boolean = first > last

    companion object {
        public val EMPTY: IntRange = IntRange(1, 0)
    }
}
{% endhighlight %}

The function `isEmpty` may sound a bit confusing at first but think about it for a moment. A range always has a start and an end as explained earlier. So at some point a range can't emit new items. This is the case when its start value is larger than its end value - cannot emit anymore items -> empty.

As you can clearly see `IntRange` extends `IntProgression` (`IntRange` is just a wrapper class around it) and implements `ClosedRange`.
ClosedRange is relatively simple and I don't think it requires much of an explanation:

{% highlight kotlin %}
public interface ClosedRange<T: Comparable<T>> {
    public val start: T
    public val endInclusive: T

    public operator fun contains(value: T): Boolean = value >= start && value <= endInclusive

    public fun isEmpty(): Boolean = start > endInclusive
}
{% endhighlight %}

Now let's look at `IntProgression`

{% highlight kotlin %}
public open class IntProgression
    internal constructor
    (
            start: Int,
            endInclusive: Int,
            step: Int
    ) : Iterable<Int> {
    init {
        if (step == 0) throw kotlin.IllegalArgumentException("Step must be non-zero.")
        if (step == Int.MIN_VALUE) throw kotlin.IllegalArgumentException("Step must be greater than Int.MIN_VALUE to avoid overflow on negation.")
    }

    public val first: Int = start

    public val last: Int = getProgressionLastElement(start.toInt(), endInclusive.toInt(), step).toInt()

    public val step: Int = step

    override fun iterator(): IntIterator = IntProgressionIterator(first, last, step)

    public open fun isEmpty(): Boolean = if (step > 0) first > last else first < last

    companion object {
        /**
         * Creates IntProgression within the specified bounds of a closed range.

         * The progression starts with the [rangeStart] value and goes toward the [rangeEnd] value not excluding it, with the specified [step].
         * In order to go backwards the [step] must be negative.
         *
         * [step] must be greater than `Int.MIN_VALUE` and not equal to zero.
         */
        public fun fromClosedRange(rangeStart: Int, rangeEnd: Int, step: Int): IntProgression = IntProgression(rangeStart, rangeEnd, step)
    }
}
{% endhighlight %}

The `iterator()` function returns an `IntProgressionIterator` instance, so let's check that class out as well

{% highlight kotlin %}
internal class IntProgressionIterator(first: Int, last: Int, val step: Int) : IntIterator() {
    private val finalElement = last
    private var hasNext: Boolean = if (step > 0) first <= last else first >= last
    private var next = if (hasNext) first else finalElement

    override fun hasNext(): Boolean = hasNext

    override fun nextInt(): Int {
        val value = next
        if (value == finalElement) {
            if (!hasNext) throw kotlin.NoSuchElementException()
            hasNext = false
        }
        else {
            next += step
        }
        return value
    }
}
{% endhighlight %}

`IntProgressionIterator` extends from `IntIterator` which is just a wrapper class around `Iterator` (`next()` will invoke `nextInt()`).
Finally we can see the logic and it is very concise and as you can see `hasNext` offers support for negative steps. Inside the `nextInt()` function a `NoSuchElementException` if there is no next element which you can test very easily

{% highlight kotlin %}
val range = 0..10
val iterator = range.iterator()
iterator.forEach { print(it) }
iterator.nextInt() //will raise the error
{% endhighlight %}

Keep in mind that you must keep a reference on the iterator, because everytime you call `range.iterator()` a new `IntProgressionIterator` will be created. Otherwise the `nextInt()` will initially return the startValue since `next` is initialized with `first` (or the last element - `if (hasNext) first else finalElement`). Then it will return the `value + step` and repeat it untill the `finalElement` was returned. Once the last element was returned `hasNext` will be set to false. 

In a nutshell int based ranges (int, long, char) don't hold all values in memory but rather calculate the next value during access. Furthermore a range class is just a wrapper around a progression class.

### Float Types
Float types are a different thing. If you want to create a range of double or float using `DoubleRange` or `FloatRange` you will realize this does not exist. Not even the progression classes. If you instantiate it using the `..` operator (`0.5..0.8`) you will see that this works. Internally this invokes `rangeTo`:

{% highlight kotlin %}
public operator fun Double.rangeTo(that: Double): ClosedFloatingPointRange<Double> = ClosedDoubleRange(this, that)
{% endhighlight %}

This returns a `ClosedFLoatingPointRange<Double>`. Previously we have already seen the `ClosedRange<T>` class so what's the difference?

{% highlight kotlin %}
@SinceKotlin("1.1")
public interface ClosedFloatingPointRange<T : Comparable<T>> : ClosedRange<T> {
    override fun contains(value: T): Boolean = lessThanOrEquals(start, value) && lessThanOrEquals(value, endInclusive)
    override fun isEmpty(): Boolean = !lessThanOrEquals(start, endInclusive)

    /**
     * Compares two values of range domain type and returns true if first is less than or equal to second.
     */
    fun lessThanOrEquals(a: T, b: T): Boolean
}
{% endhighlight %}

Basically `ClosedFloatingPointRange` just differs in the implementation of `contains()`. The comment above the class explains why:  
> This interface is implemented by floating point ranges returned by [Float.rangeTo] and [Double.rangeTo] operators to
> achieve IEEE-754 comparison order instead of total order of floating point numbers.

To understand this we need some basic background knowledge:
Kotlin tries to follow the IEEE-754 standard (for floating point numbers) when the operands are statically typed. However if this is not
the case (generics), the IEEE-754 standard is not followed correctly ([more info](https://kotlinlang.org/docs/reference/basic-types.html#floating-point-numbers-comparison)).

For our case this means that IEEE-754 is not followed exactly in the generic `ClosedFloatingPointRange` `contains()` function. But float and double do have their own private class which redefines `contains` so it complies with the standard. 

{% highlight kotlin %}
private class ClosedDoubleRange(
    start: Double,
    endInclusive: Double
) : ClosedFloatingPointRange<Double> {
    private val _start = start
    private val _endInclusive = endInclusive
    override val start: Double get() = _start
    override val endInclusive: Double get() = _endInclusive

    override fun lessThanOrEquals(a: Double, b: Double): Boolean = a <= b

    override fun contains(value: Double): Boolean = value >= _start && value <= _endInclusive
    override fun isEmpty(): Boolean = !(_start <= _endInclusive)

    override fun equals(other: Any?): Boolean {
        return other is ClosedDoubleRange && (isEmpty() && other.isEmpty() ||
                _start == other._start && _endInclusive == other._endInclusive)
    }

    override fun hashCode(): Int {
        return if (isEmpty()) -1 else 31 * _start.hashCode() + _endInclusive.hashCode()
    }

    override fun toString(): String = "$_start..$_endInclusive"
}
{% endhighlight %}

This implementation applies to the concept of [total order](https://en.wikipedia.org/wiki/Total_order).