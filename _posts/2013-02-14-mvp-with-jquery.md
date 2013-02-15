---
layout: post
category : javascript
tags : [javascript,jquery,mvp,testing]
hidden : hidden
---
{% include JB/setup %}

A few weeks ago, my friend Matt and I, at ThoughtWorks Chengdu, were discussing the use of jquery in his project. More specifically: how to test it.

Their usage of jquery is very typical. They have forms, organized in wizards, and they show or hide controls based on the values of other controls. For example, on the address form there is a radio button for local address and another radio button for international address. When you select international address, it hides the "Australian state" auto-complete input field and presents the generic "State or province" text field.

Here is what the initial code looked like:

{% highlight javascript %}
$(document).ready(function() {
	$('#internationalAddress').select(function() {
		$('#state').hide();
		$('#stateOrProvince').show();
	});
	$('#australianAddress').select(function() {
		$('#state').show();
		$('#stateOrProvince').hide();
	});
});
{% endhighlight %}

Although small and simple, there is a number of issues with that code. The one I want to talk about here is testability. It is possible to test that code on it's own but I am not comfortable calling it a unit test. It involves a DOM implementation (a browser or pseudo-browser a la phantomjs) and jquery. I would like to unit test the business logic independently of these dependencies. 

So how to refactor that code to separate business logic, DOM api, and jquery? Let's implement a model-view-presenter (MVP). _Not to be confused with a minimal viable product._

MVP is a UI pattern from the 90s. Microsoft tried to popularize it with their smart client application block and Martin Fowler [documented it](http://martinfowler.com/eaaDev/uiArchs.html#Model-view-presentermvp) in 2006. 

In a few words, it's a pattern where a controller (called a presenter) would push data to a view for presentation. It may not know exactly _how_ the data is being rendered but it knows _what_ is the data and _when_ it's being shown.

So lets go back to our code. First, we have the business logic sitting on it's own in the presenter.

{% highlight javascript %}
function AddressPresenter(view) {
	view.onAddressTypeChange(function(addressType){
		if (addressType === 'australian') {
			view.hideStateField();
			view.showStateOrProvinceField();
		} else if (addressType === 'international') {
			view.showStateField();
			view.hideStateOrProvinceField();
		}
	});
}
{% endhighlight %}

Then, we have the view:

{% highlight javascript %}
function AddressView() {
	var internationalAddressLocator = '#internationalAddress',
	australianAddressLocator = '#australianAddress',
	stateFieldLocator = '#state',
	stateOrProvinceFieldLocator = '#stateOrProvince';

	return {
		onAddressTypeChange: function (callback){ 
			$(internationalAddressLocator).select(function() { callback('international'); });
			$(australianAddressLocator).select(function() { callback('australian'); });
		},
		showStateField: function() { $(stateFieldLocator).show(); },
		hideStateField: function() { $(stateFieldLocator).hide(); },
		showStateOrProvinceField: function() { $(stateOrProvinceFieldLocator).show(); },
		hideStateOrProvinceField: function() { $(stateOrProvinceFieldLocator).hide(); }
	};
}
{% endhighlight %}

Finally, we have to hook it up inside the page:

{% highlight javascript %}
$(document).ready(function() {
	AddressPresenter(AddressView());
});
{% endhighlight %}

A few observations:
* The initial code was smaller. It contained only 10 LOC whereas the second version contains 29 LOC. Almost 3 times more. 
* All the locators and the UI implementation details are now in one place.
* The business logic around the structure of different addresses is now concentrated in the presenter.

some test
{% highlight javascript %}
describe('AddressPresenter', function() {

	var view;

	beforeEach(function() {
		view = mocker()
			.event('onAddressTypeChange')
			.action('showStateField')
			.action('hideStateField')
			.action('showStateOrProvinceField')
			.action('hideStateOrProvinceField')
			.build();
	});

	it('should show state when I select australian address', function() {
		view.triggerOnAddressTypeChange('australian');

		expect(view.showStateField).toHaveBeenCalled();
		expect(view.hideStateOrProvinceField).toHaveBeenCalled();
	});

	it('should show state when I select australian address', function() {
		view.triggerSelectInternationalAddress();

		expect(view.hideStateField).toHaveBeenCalled();
		expect(view.showStateOrProvinceField).toHaveBeenCalled();
	});
});
{% endhighlight %}

`view` here is a mock. It is generated with a simple in-house mock framework and Matt and I test-drove together using firebug as our IDE.

mock framework

try to TDD it live
