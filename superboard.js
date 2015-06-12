(function(){
    var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
    // polyfill for IE, Opera, Safari : https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/String/startsWith
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (searchString, position) {
            position = position || 0;
            return this.indexOf(searchString, position) === position;
        };
    }
    // attach the .equals method to Array's prototype to call it on any array http://stackoverflow.com/questions/7837456/comparing-two-arrays-in-javascript
    var any_equals = function (element1, element2) {
        // Check if we have nested arrays
        if (element1 instanceof Array && element2 instanceof Array) {
            // recurse into the nested arrays
            if (!array_equals(element1,element2)) {
                return false;
            }
        } else if (element1 instanceof Object && element2 instanceof Object) {
            if (!object_equals(element1, element2)) {
                return false;
            }
        } else if (element1 != element2) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
        return true;
    };
    var array_equals = function (array1, array2) {
        // if the other array2 is a falsy value, return
        if (!array2) {
            return false;
        }
        // compare lengths - can save a lot of time 
        if (array1.length != array2.length) {
            return false;
        }
    
        for (var i = 0, l=array1.length; i < l; i++) {
            if (!any_equals(array1[i],array2[i])) {
                return false;
            }
        }
        return true;
    };
    var object_equals = function(object1, object2) {
        for (propName in object1) {
            if (object1.hasOwnProperty(propName) != object2.hasOwnProperty(propName)) {
                return false;
            } else if (typeof object1[propName] != typeof object2[propName]) {
                return false;
            }
        }
        for(propName in object2) {
            if (object1.hasOwnProperty(propName) != object2.hasOwnProperty(propName)) {
                return false;
            } else if (typeof object1[propName] != typeof object2[propName]) {
                return false;
            }
    
            if(!object1.hasOwnProperty(propName)) {
                continue;
            }

            if (!any_equals(object1[propName], object2[propName])) {
                return false;
            }
        }
        return true;
    };
    var create_big_message = function($,$workspace,cls,label) {
        var get_big_message = function() {
            return $('.'+cls);
        }
        var show = function() {
            var $big_message = get_big_message();
            if ($big_message.length == 0) {
                $big_message = $('<div class="overlay-message '+cls+'"><div class="big-message">'+label+'</div></div>');
                $workspace.append($big_message);
            }
        };
        var hide = function() {
            var $big_message = get_big_message();
            if ($big_message.length > 0) {
                $big_message.remove();
            }
        };
        var showhide = function(needShow) {
            if (needShow) {
                show();
            } else {
                hide();
            }
        }
        return {
            show: show,
            hide: hide,
            showhide: showhide
        };
    };
    jQuery(function($){
        var struct_ref = [];
        var register = {};
        var $workspace = $('.workspace');
        var $allgreen = create_big_message($,$workspace,'allgreen','Super green');
        var $disconnect = create_big_message($,$workspace,'disconnect','Disconnected');
        var $icons = [$('<link></link>'),$('<link></link>')];
        $icons[0].attr('rel','icon');
        $icons[1].attr('rel','shortcut icon');
        $('head').append($icons[0]).append($icons[1]);
        var sizes = [];
        var root_url = undefined;
        var updateLayout = function(on_end) {
            $.ajax({
                dataType: "json",
                url: "layout.json"
            }).done(function(struct) {
                if (! any_equals(struct_ref,struct)) {
                    root_url = struct.root;
                    $workspace.removeClass(function(index, classes){
                        var classes_array = classes.split(' ');
                        var classIndex=0;
                        var classesToRemove='';
                        for (classIndex=0; classIndex<classes_array.length; classIndex++) {
                            if (classes_array[classIndex].startsWith('layout-')) {
                                if (classesToRemove === '') {
                                    classesToRemove += ' ';
                                }
                                classesToRemove += classes_array[classIndex];
                            }
                        }
                        return classesToRemove;
                    });
                    $workspace.addClass(struct.grid);
                    $workspace.empty();

                    for (jobName in register) {
                        register[jobName]['enabled']=0;
                    }

                    var jobIndex=0;
                    for (jobIndex=0; jobIndex<struct.jobs.length; jobIndex++)
                    {
                        var structItem = struct.jobs[jobIndex];
                        var padoutter, pad;
                        var jobName = structItem[0];
                        var jobStyle = structItem[1];
                        if (jobName !== "" && register[jobName] !== undefined) {
                            padoutter = register[jobName]['padoutter'];
                            pad = register[jobName]['padoutter'];
                            register[jobName]['enabled']=1;
                        } else {
                            padoutter = $("<div class='pad-outter'><div class='pad'></div></div>");
                            pad = padoutter.find('.pad');
                            if (jobName !== "") {
                                var registerItem = {};
                                register[jobName] = registerItem;
                                registerItem['enabled']=1;
                                registerItem['name'] = jobName;
                                registerItem['url'] = '';
                                registerItem['default-url'] = '';
                                registerItem['padoutter'] = padoutter;
                                registerItem['pad'] = pad;
                                registerItem['title'] = $("<div class='title'></div>");
                                registerItem['lastok'] = $("<div class='lastok'></div>");
                                registerItem['extra'] = $("<div class='extra'></div>");
                                registerItem['culprits'] = $("<div class='culprits'></div>");
                                registerItem['title'].text(jobName.replace(/_/g,' '));
                                (function(registerItem) {
                                    pad.click(function(e){
                                        if (registerItem['url'] !== '') {
                                            window.open(registerItem['url'], '_blank');
                                            e.preventDefault();
                                        }
                                    });
                                })(registerItem);
                                
                                pad.append(registerItem['title']);
                                pad.append(registerItem['lastok']);
                                pad.append(registerItem['extra']);
                                pad.append(registerItem['culprits']);
                                
                                // pad.addClass('ok');
                            } else {
                                pad.addClass('none');
                            }
                        }
                        var indexSize;
                        for (indexSize=0; indexSize<sizes.length; indexSize++) {
                            padoutter.removeClass(sizes[indexSize]);
                        }
                        if (jobStyle != "") {
                            padoutter.addClass(jobStyle);
                            if (__indexOf.call(sizes, jobStyle) < 0) {
                                sizes.push(jobStyle);
                            }
                        }
                        $workspace.append(padoutter);
                    }
                    struct_ref = struct;
                }
            }).always(function(){
                if (on_end !== undefined) {
                    on_end();
                }
            });
        };
        var ajaxCalls = function () {
            updateLayout();
            if (root_url !== undefined) {
                var protocol = window.location.href.split(':')[0];
                var url = root_url + "api/json?tree=*,jobs[name,color,url,lastStableBuild[timestamp],builds[timestamp,culprits[fullName]]]";
                if (protocol === "file") {
                    url = url + '&jsonp=?';
                }
                $.ajax({
                    dataType: "json",
                    url: url
                }).done(function(data) {
                    $disconnect.hide();
                    
                    var jobIndex=0;
                    var allgreen=1;
                    for (jobIndex=0; jobIndex<data.jobs.length; jobIndex++)
                    {
                        var job = data.jobs[jobIndex];
                        var registerItem = register[job.name];
                        
                        (function(job, registerItem) {
                            if (registerItem !== undefined) {
                                // console.log(job.name);
                                var status = "";
                                var active = "";
                                switch (job.color) {
                                    case "blue":
                                    case "blue_anime":
                                        status = "ok";
                                        registerItem['default-url'] = '';
                                        break;
                                    case "yellow":
                                    case "yellow_anime":
                                        status = "warn";
                                        registerItem['default-url'] = job.url + 'lastBuild/testReport';
                                        if (registerItem['enabled']) {
                                            allgreen=0;
                                        }
                                        break;
                                    case "red":
                                    case "red_anime":
                                        status = "error";
                                        registerItem['default-url'] = job.url + 'lastBuild/consoleText';
                                        if (registerItem['enabled']) {
                                            allgreen=0;
                                        }
                                        break;
                                    case "aborted":
                                    case "aborted_anime":
                                        status = "aborted";
                                        break;
                                    
                                }
            
                                switch (job.color) {
                                    case "blue_anime":
                                    case "yellow_anime":
                                    case "red_anime":
                                    case "aborted_anime":
                                        active = "active";
                                        break;
                                }
            
                                if (active == "active" && !registerItem['pad'].hasClass("active")) {
                                    registerItem['pad'].addClass("active");
                                } else if (active == "" && registerItem['pad'].hasClass("active")) {
                                    registerItem['pad'].removeClass("active");
                                }
            
                                registerItem['pad'].removeClass('ok');
                                registerItem['pad'].removeClass('warn');
                                registerItem['pad'].removeClass('error');
                                registerItem['pad'].removeClass('aborted');
            
                                if (status != "") {
                                    if (!registerItem['pad'].hasClass(status)) {
                                        registerItem['pad'].addClass(status);
                                    }
            
                                    if (job.color == 'blue') {
                                        registerItem['lastok'].text('');
                                    } else {
                                        if ((job.lastStableBuild !== undefined) && (job.lastStableBuild !== null)) {
                                            registerItem['lastok'].text(moment(job.lastStableBuild.timestamp).fromNow());
                                        } else {
                                            registerItem['lastok'].text('Jamais !!');
                                        }
                                    }
                                }
                                
                                var culpritsString = '';
                                var culprits = [];
                                var indexCulprit;
                                
                                for (indexBuild = 0, _len = job.builds.length; indexBuild < _len; indexBuild++) {
                                    var item = job.builds[indexBuild];
                                    
                                    if ((job.lastStableBuild === undefined) || (job.lastStableBuild === null) || (item.timestamp > job.lastStableBuild.timestamp)) {
                                        for (indexCulprit = 0; indexCulprit < item.culprits.length; indexCulprit++) {
                                            var culprit = item.culprits[indexCulprit].fullName;
                                            if (__indexOf.call(culprits, culprit) < 0) {
                                                culprits.push(culprit);
                                            }
                                        }
                                    }
                                }
            
                                for (indexCulprit = 0; indexCulprit < culprits.length; indexCulprit++) {
                                    if (indexCulprit > 0) {
                                        culpritsString += ', ';
                                    }
                                    culpritsString += culprits[indexCulprit];
                                }
                                // console.log(culpritsString);
                                registerItem['culprits'].text(culpritsString);
                                
                                $.ajax({
                                    dataType: "json",
                                    url: job.url + 'ws/dashboard.json'
                                }).done(function(data){
                                    registerItem['extra'].text(data.extra);
                                    if (data.link !== undefined && data.link !== '') {
                                        registerItem['url'] = data.link.replace('~',job.url);
                                    } else {
                                        registerItem['url'] = registerItem['default-url'];
                                    }
                                }).fail(function(){
                                    registerItem['extra'].text('');
                                    registerItem['url'] = registerItem['default-url'];
                                }).always(function(){
                                    if (registerItem['url'] !== '') {
                                        registerItem['pad'].addClass('link');
                                    } else {
                                        registerItem['pad'].removeClass('link');
                                    }
                                });
                            }
                        })(job,registerItem);
                    }
                    $allgreen.showhide(allgreen);
                    if (allgreen) {
                        $icons[0].attr('href','superboard-super-green.ico');
                        $icons[1].attr('href','superboard-super-green.ico');
                    } else {
                        $icons[0].attr('href','superboard.ico');
                        $icons[1].attr('href','superbaord.ico');
                    }
                }).fail(function(){
                    $disconnect.show();
                });
            }
            setTimeout(ajaxCalls, 10000);
        }
        updateLayout(ajaxCalls);
    });
})()
    
