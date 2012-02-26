    angular.widget('fancySelect', function (element) {
        this.descend(true);
        this.directives(true);

        var expression = element.attr('ng:options'),
            onChange = expressionCompile(element.attr('ng:change') || "").fnSelf,
            prompt = element.attr('ng:prompt'),
            cascadeParent = !!element.attr('ng:cascade-parent'),
            cascadeChild = !!element.attr('ng:cascade-child'),
            match,
            startIndex = !!prompt ? 1 : 0;

        var attrs = element[0].attributes
        var replacement = $("<p></p>");
        for(var i = 0; i < attrs.length; i++) {
            replacement.attr(attrs[i].name, attrs[i].value);
        }
        replacement.addClass('fancy-selectbox');
        element.replaceWith(jqLite(replacement));


        if (!expression) {
            return inputWidgetSelector.call(this, element);
        }
        if (!(match = expression.match(NG_OPTIONS_REGEXP))) {
            throw Error(
                "Expected ng:options in form of '_select_ (as _label_)? for (_key_,)?_value_ in _collection_'" +
                    " but got '" + expression + "'.");
        }

        var displayFn = expressionCompile(match[2] || match[1]).fnSelf,
            valueName = match[4] || match[6],
            keyName = match[5],
            valueFn = expressionCompile(match[2] ? match[1] : valueName).fnSelf,
            valuesFn = expressionCompile(match[7]).fnSelf,
            // we can't just jqLite('<option>') since jqLite is not smart enough
            // to create it in <select> and IE barfs otherwise.
            select = jqLite(document.createElement('a')),
            optionTemplate = $("<li></li>"),
            nullOption = false; // if false then user will not be able to select it

        return function (selectElement) {

            var optionCache = [],
                scope = this,
                model = modelAccessor(scope, element);

            // find existing special options
            forEach(selectElement.children(), function (option) {
                if (option.value == '')
                // User is allowed to select the null.
                    nullOption = { label: jqLite(option).text(), id: '' };
            });
            selectElement.html(''); // clear contents


            var selectedOptionElement = $("<span class='selected-text'></span>"),
                focusElement = $("<a class='fancy-selectbox-drophandler' href='#'></a>"),
                dropdown = $("<div class='fancy-selectbox-list hidden' style='max-height:160px'></div>"),
                options = $("<ul></ul>"),
                scrollbar;


            selectedOptionElement.bind('change', function () {
                var collection = valuesFn(scope) || [],
                    key = selectedOptionElement.attr("value"),
                    tempScope = inherit(scope),
                    value;
                try {
                    if (key == '?') {
                        value = undefined;
                    } else if (key === '' || (!!prompt && key == '0')) {
                        value = null;
                    } else {
                        key = key - startIndex;
                        tempScope[valueName] = collection[key];
                        if (keyName) tempScope[keyName] = key;
                        value = valueFn(tempScope);
                    }

                    if (isDefined(value) && model.get() !== value) {
                        onChange(scope);
                        model.set(value);
                    }

                        scope.$tryEval(function () {
                            if (cascadeParent) {
                                scope.$root.$eval();
                            } else {
                                scope.$eval();
                            }
                        });
                } finally {
                    tempScope = null; // TODO(misko): needs to be $destroy
                }
            });

            selectElement.append(focusElement);
            selectElement.append(dropdown);
            focusElement.append(selectedOptionElement);
            dropdown.append(options);

            var dropdownIsShown = false;

            var hideDropdown = function() {
                dropdown.hide();
                dropdownIsShown = false;
            };

            var initScrollBar = function() {
                if (!scrollbar) {
                    var scrollbarWidth = options.height() > 160 ? 20 : 0;
                    options.outerWidth(focusElement.outerWidth() - scrollbarWidth);
                    scrollbar = dropdown.jScrollPane({
                        showArrows: true,
                        verticalDragMinHeight: 20
                    });
                }
            }

            var isDisabled = function() {
                return selectElement.attr("ng-disabled")
            }

            var showDropdown = function() {
                if (isDisabled()) return;
                dropdown.show();
                dropdownIsShown = true;
                initScrollBar();
                var selectItem = options.find("[selected]");
                var item = selectItem.length > 0 ? selectItem : options.find("li").eq(0);
                scrollToItem(item);
            };

            var selectOption = function(target, options) {
                options = options || {skipChange: false};
                var selected = $(target);
                var text = selected.text();
                selectedOptionElement.text(text).attr("title", text).attr("value", selected.attr("value"));
                if (!options.skipChange) {
                    selectedOptionElement.change();
                    hideDropdown();
                }
            }

            var scrollToItem = function (item) {
                item.mouseover();
                var scrollTop = getScrollTop(item);
                if (scrollTop != null) {
                    scrollbar.data('jsp').scrollToY(scrollTop);
                }
            }

            var getScrollTop = function (item) {
                if (!item || !item[0]) {
                    return null;
                }
                var topOfList = item[0].offsetTop - scrollbar.data('jsp').getContentPositionY();
                if (topOfList >= 160)
                    return item[0].offsetTop;
                if (topOfList < 0)
                    return item[0].offsetTop;
                return scrollbar.data('jsp').getContentPositionY();
            }

            var moveTo = function(index) {
                var hover = options.find("[value='" + index + "']");
                scrollToItem(hover);
            }

            var move = function(getIndex) {
                var currentIndex = options.find(".hover").attr("value");
                var index = getIndex(currentIndex);
                moveTo(index);
            }

            var moveToPreviousOption = function() {
                move(function(currentIndex) {
                    return currentIndex - 1 <= 0 ? 0 : currentIndex - 1;
                })
            }

            var moveToNextOption = function() {
                move(function(currentIndex) {
                    var max = options.children().length - 1;
                    return currentIndex + 1 > max ? max : currentIndex + 1;
                })
            }

            var moveToPreviousPage = function() {
                move(function(currentIndex) {
                    return currentIndex - 7 <= 0 ? 0 : currentIndex - 7;
                })
            }

            var moveToNextPage = function() {
                move(function(currentIndex) {
                    var max = options.children().length - 1;
                    return currentIndex + 7 > max ? max : currentIndex + 7;
                })
            }

            var moveToLastOption = function() {
                move(function(currentIndex) {
                    return options.children().length - 1;
                })
            }

            var moveToFirstOption = function() {
                move(function(currentIndex) {
                    return 0;
                })
            }

            var _bindKeyPressEvents = function () {
                var find = options.selectboxFinder();
                focusElement.keydown(function (e) {
                    switch (e.keyCode) {
                        case 8: //backspace
                            showDropdown();
                            break;
                        case 9: //tab
                            hideDropdown();
                            break;
                        case 13: //enter
                            e.preventDefault();
                            var cur = focusElement.data("currentFocus");
                            if (!!cur) {
                                selectOption(cur);
                            }
                            break;
                        case 27: //esc
                            hideDropdown();
                            break;
                        case 38: //up
                            moveToPreviousOption();
                            e.preventDefault();
                            break;
                        case 40: //down
                            moveToNextOption();
                            e.preventDefault();
                            break;
                        case 33: //page up
                            moveToPreviousPage();
                            e.preventDefault();
                            break;
                        case 34: //page down
                            moveToNextPage();
                            e.preventDefault();
                            break;
                        case 35: //end
                            moveToLastOption();
                            e.preventDefault();
                            break;
                        case 36: //home
                            moveToFirstOption();
                            e.preventDefault();
                            break;
                        case 46: //delete
                            showDropdown();
                            break;
                        default:
                            var keyCode = e.keyCode;
                            moveTo(find(String.fromCharCode(keyCode)));
                            e.preventDefault();
                    }
                });
            };


            var _bindShowDropDownListEvent = function () {
                focusElement.focus(function () {
                    focusElement.data("justFocused", true);
                    if (!dropdownIsShown) {
                        showDropdown();
                    }
                    setTimeout(function() {
                        focusElement.data("justFocused", false);
                    }, 150)
                });

                focusElement.click(function (e) {
                    e.preventDefault();
                    e.target.handledby = focusElement;
                    if (!!focusElement.data("justFocused")) return;
                    if (dropdownIsShown) {
                        hideDropdown();
                    } else {
                        showDropdown();
                    }
                });

                dropdown.click(function(e){
                    e.stopPropagation();
                })

                options.click(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    selectOption(e.target);
                })

                options.bind('mouseover', function(e) {
                    focusElement.data("currentFocus", e.target);
                    options.children().removeClass("hover");
                    var option = $(e.target);
                    option.addClass("hover").attr("title", option.text());
                })

                $('body').bind('click', function (e) {
                    if(e.target.handledby === focusElement) return;
                    hideDropdown();
                });

                $(window).resize(function(){
                    scrollbar = null;
                    if(dropdownIsShown) initScrollBar();
                })
            };
            _bindShowDropDownListEvent();
            _bindKeyPressEvents();

            scope.$onEval(function () {
                var scope = this,
                    optionGroup = [],
                    option,existingOptions, existingOption,
                    values = valuesFn(scope) || [],
                    keys = values,
                    key,
                    optionScope = inherit(scope),
                    modelValue = model.get(),
                    selected,
                    selectedSet = false, // nothing is selected yet
                    lastElement,
                    element;
                
                setTimeout(function(){
                    isDisabled() ? focusElement.addClass("disabled") : focusElement.removeClass("disabled");
                }, 0)

                if (cascadeChild && !!scrollbar) {
                    scrollbar = null;
                    options.detach();
                    dropdown.detach();
                    dropdown = $("<div class='fancy-selectbox-list hidden' style='max-height:160px;'></div>");
                    dropdown.append(options);
                    selectElement.append(dropdown);
                }

                try {

                    if (!!prompt) {
                        optionGroup.push(extend({ selected: modelValue === null, id: '0', label: prompt }, nullOption));
                        selectedOptionElement.text(prompt).attr("title", prompt);
                    }
                    if (modelValue === null || nullOption || modelValue === undefined) {
                        // if we are not multiselect, and we are null then we have to add the nullOption
                        selectedSet = true;
                    }

                    // If we have a keyName then we are iterating over on object. Grab the keys and sort them.
                    if (keyName) {
                        keys = [];
                        for (key in values) {
                            if (values.hasOwnProperty(key))
                                keys.push(key);
                        }
                        keys.sort();
                    }

                    // We now build up the list of options we need (we merge later)
                    for (index = 0; length = keys.length,index < length; index++) {
                        optionScope[valueName] = values[keyName ? optionScope[keyName] = keys[index] : index];
                        selected = modelValue === valueFn(optionScope);
                        selectedSet = selectedSet || selected; // see if at least one item is selected
                        optionGroup.push({
                            id: keyName ? keys[index] : index + startIndex,   // either the index into array or key from object
                            label: displayFn(optionScope) || '', // what will be seen by the user
                            selected: selected                   // determine if we should be selected
                        });
                    }

                    existingOptions = optionCache;

                    lastElement = null;  // start at the begining
                    for (var index = 0, length = optionGroup.length; index < length; index++) {

                        option = optionGroup[index];
                        if (existingOption = existingOptions[index]) {
                            // reuse elements
                            lastElement = existingOption.element;
                            if (existingOption.label !== option.label) {
                                lastElement.text(existingOption.label = option.label);
                            }
                            if (existingOption.id !== option.id) {
                                lastElement.val(existingOption.id = option.id);
                            }
                            if (existingOption.selected !== option.selected) {
////////////////////////////////fix angular defect for ie7==========start===
                                if (option.selected) {
                                    lastElement.attr('selected', option.selected);
                                } else {
                                    lastElement.removeAttr('selected');
                                }
////////////////////////////////fix angular defect for ie7==========end===
                            }
                        } else {
                            // grow elements
                            // jQuery(v1.4.2) Bug: We should be able to chain the method calls, but
                            // in this version of jQuery on some browser the .text() returns a string
                            // rather then the element.
                            (element = optionTemplate.clone())
                                .attr('value', option.id)
                                .attr('selected', option.selected)
                                .text(option.label);
                            existingOptions.push(existingOption = {
                                element: element,
                                label: option.label,
                                id: option.id,
                                checked: option.selected
                            });
                            if (lastElement) {
                                lastElement.after(element);
                            } else {
                                options.append(element);
                            }
                            lastElement = element;
                        }
                    }
/////////////////////////////////////Tiger: fix default value incorrect issue in ie///////////////
                    var selectFirstOptionAsDefaultWhenNoselect = function() {
                        var isNoselected = true;
                        for (var j = 0, length = optionGroup.length; j < length; j++) {
                            if (optionGroup[j].selected) {
                                isNoselected = false;
                                break;
                            }
                        }
                    }
                    if (jqLite.browser.msie) {
                        selectFirstOptionAsDefaultWhenNoselect();
                    }

                    // remove any excessive OPTIONs in a group
                    while (existingOptions.length > index) {
                        existingOptions.pop().element.remove();
                    }

                    if (!!options.find("[selected]")[0]) {
                        selectOption(options.find("[selected]"), {skipChange: true});
                    }

                } finally {
                    optionScope = null; // TODO(misko): needs to be $destroy()
                }
            });
        };
    });
    
    
//===============================================================================================

var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*)|(?:\(\s*([\$\w][\$\w\d]*)\s*,\s*([\$\w][\$\w\d]*)\s*\)))\s+in\s+(.*)$/;


angularWidget('select', function(element){
  this.directives(true);
  this.descend(true);
  return element.attr('ng:model') &&
               ['$formFactory', '$compile', '$parse', '$element',
        function($formFactory,   $compile,   $parse,   selectElement){
    var modelScope = this,
        match,
        form = $formFactory.forElement(selectElement),
        multiple = selectElement.attr('multiple'),
        optionsExp = selectElement.attr('ng:options'),
        modelExp = selectElement.attr('ng:model'),
        widget = form.$createWidget({
          scope: this,
          model: modelExp,
          onChange: selectElement.attr('ng:change'),
          alias: selectElement.attr('name'),
          controller: optionsExp ? Options : (multiple ? Multiple : Single)});

    selectElement.bind('$destroy', function() { widget.$destroy(); });

    widget.$pristine = !(widget.$dirty = false);

    watchElementProperty(modelScope, widget, 'required', selectElement);
    watchElementProperty(modelScope, widget, 'readonly', selectElement);
    watchElementProperty(modelScope, widget, 'disabled', selectElement);

    widget.$on('$validate', function() {
      var valid = !widget.$required || !!widget.$modelValue;
      if (valid && multiple && widget.$required) valid = !!widget.$modelValue.length;
      if (valid !== !widget.$error.REQUIRED) {
        widget.$emit(valid ? '$valid' : '$invalid', 'REQUIRED');
      }
    });

    widget.$on('$viewChange', function() {
      widget.$pristine = !(widget.$dirty = true);
    });

    forEach(['valid', 'invalid', 'pristine', 'dirty'], function(name) {
      widget.$watch('$' + name, function(scope, value) {
        selectElement[value ? 'addClass' : 'removeClass']('ng-' + name);
      });
    });

    ////////////////////////////

    function Multiple() {
      var widget = this;

      this.$render = function() {
        var items = new HashMap(this.$viewValue);
        forEach(selectElement.children(), function(option){
          option.selected = isDefined(items.get(option.value));
        });
      };

      selectElement.bind('change', function() {
        widget.$apply(function() {
          var array = [];
          forEach(selectElement.children(), function(option){
            if (option.selected) {
              array.push(option.value);
            }
          });
          widget.$emit('$viewChange', array);
        });
      });

    }

    function Single() {
      var widget = this;

      widget.$render = function() {
        selectElement.val(widget.$viewValue);
      };

      selectElement.bind('change', function() {
        widget.$apply(function() {
          widget.$emit('$viewChange', selectElement.val());
        });
      });

      widget.$viewValue = selectElement.val();
    }

    function Options() {
      var widget = this,
          match;

      if (! (match = optionsExp.match(NG_OPTIONS_REGEXP))) {
        throw Error(
          "Expected ng:options in form of '_select_ (as _label_)? for (_key_,)?_value_ in _collection_'" +
          " but got '" + optionsExp + "'.");
      }

      var widgetScope = this,
          displayFn = $parse(match[2] || match[1]),
          valueName = match[4] || match[6],
          keyName = match[5],
          groupByFn = $parse(match[3] || ''),
          valueFn = $parse(match[2] ? match[1] : valueName),
          valuesFn = $parse(match[7]),
          // we can't just jqLite('<option>') since jqLite is not smart enough
          // to create it in <select> and IE barfs otherwise.
          optionTemplate = jqLite(document.createElement('option')),
          optGroupTemplate = jqLite(document.createElement('optgroup')),
          nullOption = false, // if false then user will not be able to select it
          // This is an array of array of existing option groups in DOM. We try to reuse these if possible
          // optionGroupsCache[0] is the options with no option group
          // optionGroupsCache[?][0] is the parent: either the SELECT or OPTGROUP element
          optionGroupsCache = [[{element: selectElement, label:''}]];

      // find existing special options
      forEach(selectElement.children(), function(option) {
        if (option.value == '') {
          // developer declared null option, so user should be able to select it
          nullOption = jqLite(option).remove();
          // compile the element since there might be bindings in it
          $compile(nullOption)(modelScope);
        }
      });
      selectElement.html(''); // clear contents

      selectElement.bind('change', function() {
        widgetScope.$apply(function() {
          var optionGroup,
              collection = valuesFn(modelScope) || [],
              key = selectElement.val(),
              tempScope = inherit(modelScope),
              value, optionElement, index, groupIndex, length, groupLength;

          if (multiple) {
            value = [];
            for (groupIndex = 0, groupLength = optionGroupsCache.length;
            groupIndex < groupLength;
            groupIndex++) {
              // list of options for that group. (first item has the parent)
              optionGroup = optionGroupsCache[groupIndex];

              for(index = 1, length = optionGroup.length; index < length; index++) {
                if ((optionElement = optionGroup[index].element)[0].selected) {
                  if (keyName) tempScope[keyName] = key;
                  tempScope[valueName] = collection[optionElement.val()];
                  value.push(valueFn(tempScope));
                }
              }
            }
          } else {
            if (key == '?') {
              value = undefined;
            } else if (key == ''){
              value = null;
            } else {
              tempScope[valueName] = collection[key];
              if (keyName) tempScope[keyName] = key;
              value = valueFn(tempScope);
            }
          }
          if (isDefined(value) && modelScope.$viewVal !== value) {
            widgetScope.$emit('$viewChange', value);
          }
        });
      });

      widgetScope.$watch(render);
      widgetScope.$render = render;

      function render() {
        var optionGroups = {'':[]}, // Temporary location for the option groups before we render them
            optionGroupNames = [''],
            optionGroupName,
            optionGroup,
            option,
            existingParent, existingOptions, existingOption,
            modelValue = widget.$modelValue,
            values = valuesFn(modelScope) || [],
            keys = keyName ? sortedKeys(values) : values,
            groupLength, length,
            groupIndex, index,
            optionScope = inherit(modelScope),
            selected,
            selectedSet = false, // nothing is selected yet
            lastElement,
            element;

        if (multiple) {
          selectedSet = new HashMap(modelValue);
        } else if (modelValue === null || nullOption) {
          // if we are not multiselect, and we are null then we have to add the nullOption
          optionGroups[''].push({selected:modelValue === null, id:'', label:''});
          selectedSet = true;
        }

        // We now build up the list of options we need (we merge later)
        for (index = 0; length = keys.length, index < length; index++) {
             optionScope[valueName] = values[keyName ? optionScope[keyName]=keys[index]:index];
             optionGroupName = groupByFn(optionScope) || '';
          if (!(optionGroup = optionGroups[optionGroupName])) {
            optionGroup = optionGroups[optionGroupName] = [];
            optionGroupNames.push(optionGroupName);
          }
          if (multiple) {
            selected = selectedSet.remove(valueFn(optionScope)) != undefined;
          } else {
            selected = modelValue === valueFn(optionScope);
            selectedSet = selectedSet || selected; // see if at least one item is selected
          }
          optionGroup.push({
            id: keyName ? keys[index] : index,   // either the index into array or key from object
            label: displayFn(optionScope) || '', // what will be seen by the user
            selected: selected                   // determine if we should be selected
          });
        }
        if (!multiple && !selectedSet) {
          // nothing was selected, we have to insert the undefined item
          optionGroups[''].unshift({id:'?', label:'', selected:true});
        }

        // Now we need to update the list of DOM nodes to match the optionGroups we computed above
        for (groupIndex = 0, groupLength = optionGroupNames.length;
             groupIndex < groupLength;
             groupIndex++) {
          // current option group name or '' if no group
          optionGroupName = optionGroupNames[groupIndex];

          // list of options for that group. (first item has the parent)
          optionGroup = optionGroups[optionGroupName];

          if (optionGroupsCache.length <= groupIndex) {
            // we need to grow the optionGroups
            existingParent = {
              element: optGroupTemplate.clone().attr('label', optionGroupName),
              label: optionGroup.label
            };
            existingOptions = [existingParent];
            optionGroupsCache.push(existingOptions);
            selectElement.append(existingParent.element);
          } else {
            existingOptions = optionGroupsCache[groupIndex];
            existingParent = existingOptions[0];  // either SELECT (no group) or OPTGROUP element

            // update the OPTGROUP label if not the same.
            if (existingParent.label != optionGroupName) {
              existingParent.element.attr('label', existingParent.label = optionGroupName);
            }
          }

          lastElement = null;  // start at the begining
          for(index = 0, length = optionGroup.length; index < length; index++) {
            option = optionGroup[index];
            if ((existingOption = existingOptions[index+1])) {
              // reuse elements
              lastElement = existingOption.element;
              if (existingOption.label !== option.label) {
                lastElement.text(existingOption.label = option.label);
              }
              if (existingOption.id !== option.id) {
                lastElement.val(existingOption.id = option.id);
              }
              if (existingOption.element.selected !== option.selected) {
                lastElement.prop('selected', (existingOption.selected = option.selected));
              }
            } else {
              // grow elements

              // if it's a null option
              if (option.id === '' && nullOption) {
                // put back the pre-compiled element
                element = nullOption;
              } else {
                // jQuery(v1.4.2) Bug: We should be able to chain the method calls, but
                // in this version of jQuery on some browser the .text() returns a string
                // rather then the element.
                (element = optionTemplate.clone())
                    .val(option.id)
                    .attr('selected', option.selected)
                    .text(option.label);
              }

              existingOptions.push(existingOption = {
                  element: element,
                  label: option.label,
                  id: option.id,
                  selected: option.selected
              });
              if (lastElement) {
                lastElement.after(element);
              } else {
                existingParent.element.append(element);
              }
              lastElement = element;
            }
          }
          // remove any excessive OPTIONs in a group
          index++; // increment since the existingOptions[0] is parent element not OPTION
          while(existingOptions.length > index) {
            existingOptions.pop().element.remove();
          }
        }
        // remove any excessive OPTGROUPs from select
        while(optionGroupsCache.length > groupIndex) {
          optionGroupsCache.pop()[0].element.remove();
        }
      };
    }
  }];
});    
    
    
    
    