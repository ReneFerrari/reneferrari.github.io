---
layout: post
title:  "Understand Boxing in Kotlin 🥊"
date:   2019-06-15
excerpt: "What it is, when it happens and how to deal with it."
---
## Introduction
Boxing describes the process of converting a primitive value to an object and unboxing therefore the inverse: object to primitve. Autoboxing refers to the process in which the compiler will handle this automatically for you. Whilst this is very handy it unfortunately leads to a decrease in performance. An example of autoboxing would be the following:

{% highlight java %}
Integer x = 42;
Integer y = Integer.valueOf(42);
{% endhighlight %}

Both of this lines do the exact same thing internally. In the first line the primitive int value 42 is autboxed and in the second line I manually box it.

Note: This article only covers Kotlin being ran on the JVM.

## Nullability
If you have played around with Java a bit you will know that it offers primitive types and wrapper classes like `int` and `Integer`. Contrary to that, Kotlin only has `Int` which will be represented as primitive if the value is non-nullable (and as object if it is nullable).

If you want to investigate this yourself you can do that by looking at the bytecode.  In Android Studio or IntelliJ you can view it by clicking `Tools -> Kotlin -> Show Kotlin Bytecode`. It may look a bit confusing at first but [sites like this](https://www.wikiwand.com/en/Java_bytecode_instruction_listings) will help you understand it. Furthermore you can also press the `Decompile` button which translates the bytecode to Java - a lot easier on the eyes.

## Arrays
Arrays can either be represented by primitives or objects and in Kotlin there are two ways to generate them:

{% highlight kotlin %}
val x: IntArray = intArrayOf(0, 1, 2, 3)
val y: Array<Int> = arrayOf(0, 1, 2, 3)
{% endhighlight %} 

which translates to:

{% highlight java %}
int[] x = new int[]{0, 1, 2, 3};
Integer[] y = new Integer[]{0, 1, 2, 3};
{% endhighlight %}

There are two things to notice here:
1. Kotlin has dedicated classes for primitive type arrays (`IntArray`, `DoubleArray`, etc.)
2. `Array<Int>` translates to `Integer[]`

As you can see it is advisable to always use the corresponding class when creating a primitive array whenever possible. They were specifically created to avoid the overhead of boxing. Of course, you cannot store `null` in it and if you are required to do so, you would have to - sadly - fall back and use `Array<Int?>`.

## Collections
Unfortunately Collections do not support primitive types at all due to limitations of Generics. They have been implemented with type erasure, so during runtime an `ArrayList<Integer>` would become `ArrayList<Object>`. Therefore whenever you want to add a value it has to be casted to `Object` and when you retrieve a value it has to be casted to `Integer`. Since primitives can't be casted to object (nor can an object be casted to a primitive) Generics of primitive types can't exist. This whole design approach was chosen back in 2004 (9 years after Javas initial release) to not break compatibility with existing Java code.

Here are some examples:
{% highlight kotlin %}
val w: List<Int?> = arrayListOf(5,5,5)
val x: List<Int> = listOf(5,5,5)
val y: MutableList<Int?> = mutableListOf(5,5,5)
val z: MutableList<Int> = mutableListOf(5,5,5)
{% endhighlight %}

which translates to:

{% highlight java %}
List w = (List)CollectionsKt.arrayListOf(new Integer[]{5, 5, 5});
List x = CollectionsKt.listOf(new Integer[]{5, 5, 5});
List y = CollectionsKt.mutableListOf(new Integer[]{5, 5, 5});
List z = CollectionsKt.mutableListOf(new Integer[]{5, 5, 5});
{% endhighlight %}

As you can see all of them lead to an `Integer[]` and therefore to boxing of the values.

## Lambdas
Lambdas in Kotlin are really great and useful, but they can lead to a lot of unneeded boxing and unboxing. Consider this function `foo` taking another function `bar` as argument:

{% highlight kotlin %}
fun foo(bar: (Int) -> Int) {
    //Nothing interesting in here
}
{% endhighlight %}

which translates to:

{% highlight java %}
public static final void foo(@NotNull Function1 bar) {
    Intrinsics.checkParameterIsNotNull(bar, "bar");
}
{% endhighlight %}

As you can see our function `bar` is declared as `Function1`. If you further inspect that and go to the definition of it you will see the following:

{% highlight kotlin %}
public interface Function1<in P1, out R> : Function<R> {
    /** Invokes the function with the specified argument. */
    public operator fun invoke(p1: P1): R
}
{% endhighlight %}

Generics all over the place. We have previously learned that since generics can't deal with primitives, this leads to a lot of boxing and unboxing. You can avoid this by marking the function as inline. An inline function can be imagined like this: Copying the function body and pasting it to the point where it is invoked. To better showcase this I have extended my previous example a little bit.

{% highlight kotlin %}
fun main() {
    foo { test ->
        test * 2
    }
}

inline fun foo(bar: (Int) -> Int) {
     val x = 15
     bar(25 + x)
}
{% endhighlight %}

which translates to:

{% highlight java %}
public static final void main() {
    int x$iv = 15;
    int test = 25 + x$iv;
    int var10000 = test * 2;
}
{% endhighlight %}

As you can clearly see the code of `foo` (including the lambda `bar`) is directly written inside the `main` function. Furthermore only primitives are used which is exactly what we wanted - a dream coming true. Unfortunately inlining comes with its own pros and cons but I won't cover them in this article. However you can check [this out](https://discuss.kotlinlang.org/t/did-you-consider-to-make-inline-the-default-behaviour/12719) or read the [the official documentation](https://kotlinlang.org/docs/reference/inline-functions.html) which is always a great resource.

## Key Takeaways
There are only a few points which you should always remember:
- Avoid nullability (if possible)
- Prefer the dedicated classes for primitives when using arrays
- Consider using an array instead of a collection (if appropriate)
- Consider inlining of functions (if appropriate)
