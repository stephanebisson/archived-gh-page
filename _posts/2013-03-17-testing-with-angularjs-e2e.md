---
layout: post
category : javascript
tags : 
    - angularjs
    - testing
---
{% include JB/setup %}

# Testing with Angular's E2E Testing Framework

_Special Collaboration_

NOTE: _This article is a work in progress, and a special collaboration between [Stephane Bisson](https://github.com/stephanebisson), who developed the concept, the app, and the spec, and [Kyle Hodgson](http://www.kylehodgson.com) who helped write and produce the article._

## The Problem

Testing [AngularJS](http://angularjs.org/) applications with Selenium can be difficult! I've seen teams struggle with waits and timeouts, writing jQuery selectors, and all sorts of complicated things to work around these limitations. Selenium, and in particular Selenium with WebDriver, can be a challenge when working with any "Web 2.0" site, and a single page application built with Angular presents even bigger challenges. Part of the challenge is that Selenium doesn't know when Angular is finished adding functionality to the page.

## Enter E2E

Angular's team has developed a project called ["E2E"](http://docs.angularjs.org/guide/dev_guide.e2e-testing), or the "End to End" testing framework. It allows developers to test in multiple browsers at the same time, while your output scrolls past on a terminal every time you change your code without having to re-run a slow functional test. It doesn't do everything Selenium does, but it's much much faster at running tests on AngularJS sites.

<!-- How does Angular E2E solve the problems webdriver has? -->

## Getting Started

Create an application. For instance, here's a simple, but [well structured example app](https://github.com/stephanebisson/e2e-example). You'll also need have e2e and testacular installed.

<!-- 
	I want to add how to install e2e, is that required or is it part of angular all the time?
	I want to add how e2e works. Who boots e2e? 
-->

{% highlight bash %}
npm install
{% endhighlight %}

<!--  You also need the site running. We don't show how to do that in the post. -->

If you're in the directory with the index.html and app.js, you can start a simple web server on port 8003 like this:

{% highlight bash %}
npm start
{% endhighlight %}

## Set up Testacular

You'll need to create a testacular config file. It's easy to specify the browsers, by using the testacular init command. It asks you a few questions and creates the file for you. That process looks like this, you can see us provide some sensible defaults below.

{% highlight bash %}
$ testacular  init

Which testing framework do you want to use ?
Press tab to list possible options. Enter to move to the next question.
> jasmine


Do you want to capture a browser automatically ?
Press tab to list possible options. Enter empty string to move to the next question.
> Chrome
> Firefox
> Safari

Which files do you want to test ?
You can use glob patterns, eg. "js/*.js" or "test/**/*Spec.js".
Enter empty string to move to the next question.
> spec/**/*.js


Do you want Testacular to watch all the files and run the tests on change ?
Press tab to list possible options.
> yes

{% endhighlight %}

## The Spec

Write a simple test scenario. If you're used to Jasmine's approach you might think of this like a Jasmine spec.

{% highlight javascript %}
describe('my app', function() {
	it('should login', function() {
		browser().navigateTo('/');

		input('username').enter('steph');
		input('password').enter('steph');
		element('#login').click();

		expect(browser().location().url()).toBe("/home");

		expect(element('#user').text()).toEqual('steph');
	});
});
{% endhighlight %}

## Start Testacular

Once you start testacular, it's going to watch your source code files for changes, and automatically display the test results on the console.

{% highlight bash %}
testacular start <name-of-config-file.js>
{% endhighlight %}

_or_

{% highlight bash %}
npm test
{% endhighlight %}

Edit your app or your tests and see it run!  The end result looks something like this:

![E2E in action](/images/e2e-in-action.png)

As you can see, tested in all three browsers with test output in the console.  Voila! I love this workflow - keep your favorite text editor open, keep a terminal open, watch your tests go red and green while you work.


