//Global Variables
var base64Data;
var jsonData;
var finalSpecies;

//JQuery to enable color change on selection of grid panel - Multi-Choice Selection
$(document).ready(function() {
    //Add Color Class to the selected Image for Failure Cause
    var addFailureClass = 'failureColor';
    var $failure = $('.failure-panel').click(function(e) {
        $failure.find('.panel-footer.failure-cause').removeClass(addFailureClass);
        $(this).find('.panel-footer.failure-cause').addClass(addFailureClass);
        //Send to the next page when the option is selected
        $("#alert2").hide();
        $("#headbar").collapse('hide');
        $("#syncDiv").slideUp();
        $("#recentDiv").slideUp();
        $("#submitDiv2").toggle('slide', {
            direction: 'left'
        }, 500, function() {
            $("#submitDiv3").slideDown();
        });
    });

    //Add Color Class to the Species Selector and Open a Modal with List View for selection
    var addTreeClass = 'treeColor';
    var $tree = $('.tree-panel').click(function(e) {
        //Set Color for the panel footer with class tree-type
        $tree.find('.panel-footer.tree-type').removeClass(addTreeClass);
        $(this).find('.panel-footer.tree-type').addClass(addTreeClass);

        //Open the modal with the required list view for selection
        var treeSpecies = "";
        //treeSpecies = getSpecies($(".treeColor").html());
        treeSpecies = getSpecies($(".treeColor").html());
        //alert(treeSpecies);
        var length = treeSpecies.length;
        $("#speciesList").html("");
        for (i = 0; i < length; i++) {
            $("#speciesList").append('<p class="list-group-item">' + treeSpecies[i] + '</p>');
        }
        $('#speciesListModal').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        //Handle click events on the line items in the Species Selection Modal
        $(".list-group-item").click(function() {
            $('#speciesListModal').modal('hide');
            $("#alert3").hide();
            document.getElementById('treeSpeciesText').innerHTML = '<strong style="color:red">Selected Tree Species</strong> : ' + $(this).html();
            finalSpecies = $(this).html();

            //Move to Submit Div 3 for next steps
            $("#alert3").hide();
            $("#headbar").collapse('hide');
            $("#syncDiv").slideUp();
            $("#recentDiv").slideUp();
            $("#submitDiv3").toggle('slide', {
                direction: 'left'
            }, 500, function() {
                $("#submitDiv4").slideDown();
            });
        });
    });



    //Run the following functions when form is submitted
    $("#submitDiv4Button").click(function() {
        //Setup modal with the required data
        document.getElementById("modalTitle").innerHTML = "Storing Data..";
        document.getElementById("modalBody").innerHTML = '<p>' + 'Your data is being processed and stored!' + '</p>' + '<div class="progress">' + '<div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100" style="width: 100%">' + '</div>' + '</div>';

        //Show modal with the required options
        $("#loadModal").modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });

        var storeTime = createJson();
        var localCheck = false;
        console.log("Data returned from createJson : " + storeTime);
        if (Boolean(window.openDatabase)) {
            localCheck = storeLocal(jsonData, storeTime);
        }
        console.log("Local Check : " + localCheck);
        setCid();

        //Check Online Conditions
        if (checkNetwork()) {
            //Check WIFI Conectivity
            if (checkWifi) {
                //Store to Cloudant DB
                storeCloudant(jsonData, storeTime, true);
                if (Boolean(window.openDatabase) && localStorage.getItem("toSync") == "true") {
                    syncData(function() {
                        //Do Nothing
                    });
                }
            } else {
                $("#loadModal").modal('hide');
                bootbox.confirm("Would you like to submit using Cellular Data? You can select cancel and sync later using WIFI if you would like!", function(result) {
                    if (result) {
                        //Show modal with the required options
                        $("#loadModal").modal({
                            backdrop: 'static',
                            keyboard: false,
                            show: true
                        });
                        storeCloudant(jsonData, storeTime, true);
                        if (Boolean(window.openDatabase) && localStorage.getItem("toSync") == "true") {
                            syncData(function() {
                                //Do nothing
                            });
                        }
                    } else {
                        if (Boolean(window.openDatabase)) {
                            $("#loadModal").modal({
                                backdrop: 'static',
                                keyboard: false,
                                show: true
                            });
                            localStorage.setItem("toSync", "true");
                            $("#loadModal").modal('hide');
                            //Send to Offline Storage Alert Page
                            window.location = "/failure.html";
                        } else {
                            //Show Offline Modal here
                            bootbox.alert("Oops! Your device does not support offline storage! You will need to submit with Cellular Data.");
                        }
                    }
                });
            }
        } else {
            if (Boolean(window.openDatabase) && localCheck == true) {
                localStorage.setItem("toSync", "true");

                $("#loadModal").modal('hide');
                //Send to Offline Storage Alert Page
                window.location = "/failure.html";
            } else {
                $("#loadModal").modal('hide');
                //Show Offline Modal here
                bootbox.alert("Your device does not support offline storage!");
            }
        }
    });
});

//On Load of Page Functions to be called - Execution Order
function loadData() {
    console.log("Load Data has been called");
    console.log(localStorage.getItem("toSync"));
    //Setup modal with the required data
    document.getElementById("modalTitle").innerHTML = "Please Wait :)";
    document.getElementById("modalBody").innerHTML = '<p>' + 'We are initializing the content for your page!' + '</p>' + '<div class="progress">' + '<div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100" style="width: 100%">' + '</div>' + '</div>';
    //Show modal with the required options
    $("#loadModal").modal({
        backdrop: 'static',
        keyboard: false,
        show: true,
    });

    //Checks network and then proceeds with functionality
    if (checkNetwork()) {
        getLocation(function(position, type) {
            //Check local availability of Crew ID and appent to form if available
            getCid();

            //alert("Callback has been called");
            //alert(type);
            //alert(position);
            if (type == "POS") {
                document.getElementById("lat").value = position.coords.latitude;
                document.getElementById("long").value = position.coords.longitude;
                document.getElementById("addr").value = position.coords.latitude + "," + position.coords.longitude;
            } else if (type == "ERR") {
                addStreetAddress();
            }

            if (document.getElementById("lat").value == "" || document.getElementById("long").value == "") {
                addStreetAddress();
            }

            console.log("WebSQL support? : " + Boolean(window.openDatabase));

            if (Boolean(window.openDatabase)) {
                //Call Sync Data Function
                syncData(function() {
                    //Get number of records that need to be synced and add to the top menu
                    console.log("Inside syncData Callback");
                    getLocalRowCount(function(len) {
                        if (len == 0 || len == "undefined") {
                            //Need to add alert to Sync Div
                            document.getElementById("syncAlert").innerHTML = '<strong>Your all set!</strong> There is no local data to sync right now.';
                            document.getElementById("syncAlert").setAttribute('class', 'alert alert-info');
                            $("#syncAlert").show();
                            $("#syncAccordion").hide();
                            //console.log("Sync Div was deactivated");
                        } else {
                          //Call getLocalAsJson and create syncDiv page
                          getLocalAsJson(function(response) {
                              if (response == null) {
                                  document.getElementById("syncAlert").innerHTML = '<strong>Oops!</strong> Looks like local storage is not supported on your device!';
                                  document.getElementById("syncAlert").setAttribute('class', 'alert alert-danger');
                                  $("#syncAlert").show();
                                  $("#syncAccordion").hide();
                              } else {
                                  $("#syncAlert").hide();
                                  document.getElementById("syncAccordion").innerHTML = "";
                                  //Create the panels with the details
                                  var len = response.trimRecords.length;
                                  var placeRecord = "";
                                  for (i = 0; i < len; i++) {
                                      var syncItem = JSON.parse(response.trimRecords[i]);
                                      //console.log(syncItem);
                                      //console.log(syncItem.address);

                                      placeRecord += '<div class="panel panel-default"><div class="panel-heading" role="tab" id="heading' + i + '"><h4 class="panel-title"><a role="button" data-toggle="collapse" data-parent="#syncAccordion" style="text-decoration:none" href="#collapse' + i + '" aria-expanded="true" aria-controls="collapse' + i + '"><strong><span class="glyphicon glyphicon-calendar" aria-hidden="true"></span>&nbsp ' + getDateString(syncItem.date) + '</strong> &nbsp<span class="badge">Crew ID = ' + syncItem.crewId + '</span></a></h4></div><div id="collapse' + i + '" class="panel-collapse collapse" role="tabpanel" aria-labelledby="heading' + i + '"><div class="panel-body"><table class="table table-striped noMarginTop noMarginBottom"><tbody>';
                                      if (syncItem.workOrder != "NA") {
                                          placeRecord += '<tr><td><strong>Work Order</strong></td> <td>' + syncItem.workOrder + '</td></tr>';
                                      }
                                      placeRecord += '<tr><td><strong>Failure Type</strong></td><td>' + syncItem.failType + '</td></tr><tr><td><strong>Tree Species</strong></td><td>' + syncItem.treeSpecies + '</td></tr><tr><td><strong>Right of Way</strong></td><td>' + syncItem.RoWType + '</td></tr><tr><td><strong>Failure Cause</strong></td><td>' + syncItem.failureCause + '</td></tr><tr><td><strong>Time</strong></td><td>' + getTimeString(syncItem.time) + '</td></tr></tbody></table>';
                                      if (syncItem.userComments != "NA") {
                                          placeRecord += '<p><span class="badge">Comments</span>&nbsp' + syncItem.userComments + '</p>';
                                      }

                                      placeRecord += '</div><div class="panel-footer"><h5 class="noMarginTop"><span class="glyphicon glyphicon-map-marker" aria-hidden="true"></span>&nbsp{' + syncItem.address + '}</h5></div></div></div>';
                                      document.getElementById("syncAccordion").innerHTML = placeRecord;
                                      console.log(placeRecord);
                                      $("#syncAccordion").show();
                                  }
                                  //console.log(response.trimRecords);
                              }
                          });
                        }
                    });
                });
            } else {
                //Add alert that Offline is not supporter on Sync Div
                document.getElementById("syncAlert").innerHTML = '<strong>Alert!</strong> Offline Storage and Sync is not supported by your browser.';
                document.getElementById("syncAlert").setAttribute('class', 'alert alert-danger');
                $("#syncAlert").show();
                $("#syncAccordion").hide();
            }

            $("#loadModal").modal('hide');
        });
    } else {
        //Check local availability of Crew ID and appent to form if available
        getCid();
        addStreetAddress();

        if (Boolean(window.openDatabase)) {
            //Get number of records that need to be synced and add to the top menu
            getLocalRowCount(function(len) {
                if (len == 0 || len == "undefined") {
                    //Need to add alert to Sync Div
                    document.getElementById("syncAlert").innerHTML = '<strong>Your all set!</strong> There is no local data to sync right now.';
                    document.getElementById("syncAlert").setAttribute('class', 'alert alert-info');
                    $("#syncAlert").show();
                    $("#syncAccordion").hide();
                    //console.log("Sync Div was deactivated");
                } else {
                    //Call getLocalAsJson and create syncDiv page
                    getLocalAsJson(function(response) {
                        if (response == null) {
                            document.getElementById("syncAlert").innerHTML = '<strong>Oops!</strong> Looks like local storage is not supported on your device!';
                            document.getElementById("syncAlert").setAttribute('class', 'alert alert-danger');
                            $("#syncAlert").show();
                            $("#syncAccordion").hide();
                        } else {
                            $("#syncAlert").hide();
                            document.getElementById("syncAccordion").innerHTML = "";
                            //Create the panels with the details
                            var len = response.trimRecords.length;
                            var placeRecord = "";
                            for (i = 0; i < len; i++) {
                                var syncItem = JSON.parse(response.trimRecords[i]);
                                //console.log(syncItem);
                                console.log(syncItem.address);

                                placeRecord += '<div class="panel panel-default"><div class="panel-heading" role="tab" id="heading' + i + '"><h4 class="panel-title"><a role="button" data-toggle="collapse" data-parent="#syncAccordion" style="text-decoration:none" href="#collapse' + i + '" aria-expanded="true" aria-controls="collapse' + i + '"><strong><span class="glyphicon glyphicon-calendar" aria-hidden="true"></span>&nbsp ' + getDateString(syncItem.date) + '</strong> &nbsp<span class="badge">Crew ID = ' + syncItem.crewId + '</span></a></h4></div><div id="collapse' + i + '" class="panel-collapse collapse" role="tabpanel" aria-labelledby="heading' + i + '"><div class="panel-body"><table class="table table-striped noMarginTop noMarginBottom"><tbody>';
                                if (syncItem.workOrder != "NA") {
                                    placeRecord += '<tr><td><strong>Work Order</strong></td> <td>' + syncItem.workOrder + '</td></tr>';
                                }
                                placeRecord += '<tr><td><strong>Failure Type</strong></td><td>' + syncItem.failType + '</td></tr><tr><td><strong>Tree Species</strong></td><td>' + syncItem.treeSpecies + '</td></tr><tr><td><strong>Right of Way</strong></td><td>' + syncItem.RoWType + '</td></tr><tr><td><strong>Failure Cause</strong></td><td>' + syncItem.failureCause + '</td></tr><tr><td><strong>Time</strong></td><td>' + getTimeString(syncItem.time) + '</td></tr></tbody></table>';
                                if (syncItem.userComments != "NA") {
                                    placeRecord += '<p><span class="badge">Comments</span>&nbsp' + syncItem.userComments + '</p>';
                                }

                                placeRecord += '</div><div class="panel-footer"><h5 class="noMarginTop"><span class="glyphicon glyphicon-map-marker" aria-hidden="true"></span>&nbsp{' + syncItem.address + '}</h5></div></div></div>';
                                document.getElementById("syncAccordion").innerHTML = placeRecord;
                                //console.log(placeRecord);
                                $("#syncAccordion").show();
                            }
                            //console.log(response.trimRecords);
                        }
                    });
                }
            });
        } else {
            //Add alert that Offline is not supporter on Sync Div
            document.getElementById("syncAlert").innerHTML = '<strong>Alert!</strong> Offline Storage and Sync is not supported by your browser.';
            document.getElementById("syncAlert").setAttribute('class', 'alert alert-danger');
            $("#syncAlert").show();
        }

        $("#loadModal").modal('hide');
    }
}

//Function to append Street Address to the page in place of GPS Coordinates
function addStreetAddress() {
    $("#latField").hide();
    $("#longField").hide();
    $("#addrField").show();
}

//Check network connectivity of Client Device
function checkNetwork() {
    if (navigator.onLine) {
        return true;
    } else {
        return false;
    }
}

//Get Geolocation Coordinates
function getLocation(callback) {
    //alert("Get Location was called");
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            callback(position, "POS");
        }, function(err) {
            callback(err, "ERR");
        }, {
            timeout: 5000
        });
    } else {
        //If Browser not compatible then it will change to Street Address
        addStreetAddress();
    }
}

//Function to Check WIFI Connectivity
function checkWifi() {
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var contype = connection.type;
    if (contype == "wifi") {
        return true;
    } else {
        return false;
    }
}

//Get Crew ID if available from the HTML5 Local Persisted Storage
function getCid() {
    if (localStorage.getItem("cid") != null) {
        document.getElementById("cid").value = localStorage.getItem("cid");
    }
}

//Store Crew ID in the HTML5 Local Persisted Storage
function setCid() {
    var cid = document.getElementById("cid").value;
    localStorage.setItem("cid", cid);
    //alert(localStorage.getItem("cid"));
}

//Function to convert Image Path to Base64
function toBase64() {
    var pictureFile = document.getElementById("picture-input").files;
    if (pictureFile.length > 0) {
        var fileToLoad = pictureFile[0];
        var fileReader = new FileReader();

        fileReader.onload = function(fileLoadedEvent) {
            base64Data = fileLoadedEvent.target.result;

            addPictureToPage(base64Data);
        }
    }
    fileReader.readAsDataURL(fileToLoad);
}

function resizeBase64Img(base64) {
    var img = document.createElement("img");
    img.src = "" + base64;
    var imageTest;

    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var context = canvas.getContext("2d");

    context.scale(0.25, 0.25);
    context.drawImage(img, 0, 0);

    return canvas.toDataURL();
}

//Function to place the image in the form HTML
function addPictureToPage(base64Data) {
    $("#imagePanel").hide();
    document.getElementById("showPicture").src = base64Data;
    $("#showPicture").show();
    document.getElementById("showPicture").setAttribute("onclick", "showImagePanel()");
    document.getElementById("pictureHintText").innerHTML = "<strong>Want to change the picture?Click Me</strong>";
    document.getElementById("pictureHintText").setAttribute("onclick", "showImagePanel()");
}

//Function to re-show the Image Panel
function showImagePanel() {
    $("#imagePanel").show();
    $("#showPicture").hide();
    document.getElementById("pictureHintText").innerHTML = "<strong>Take another Picture!</strong>";
    //base64Data = "";
    document.getElementById("picture-input").value = "";
    if (document.getElementById("pictureHintText").hasAttribute("onclick")) {
        document.getElementById("pictureHintText").removeAttribute("onclick");
    }
}

//Function to create JSON
function createJson() {
    //Get all the form field elements
    var address = document.getElementById("addr").value;
    var workOrder = document.getElementById("workOrder").value;
    if (workOrder == "" || workOrder == null) {
        workOrder = "NA";
    }
    var CrewID = document.getElementById("cid").value;
    var failType = $("#failureGroup").find("button.active").prop('value');
    var RoWType = $("#RoWGroup").find("button.active").prop('value');

    var userComments = document.getElementById("comments").value;
    if (userComments == "" || userComments == null) {
        userComments = "NA";
    }

    //Get the image selection for failure cause
    var failureCause = $(".failureColor").html();
    var dateOnly = getDateStamp();
    var timeAlso = getTimeStamp();
    console.log(dateOnly + " : is date stamp and " + timeAlso + " is the time also");
    //Get Reduced Base64 Image
    var reducedBase64 = resizeBase64Img(base64Data);
    //alert(reducedBase64);

    //JSON object
    jsonData = {
        "date": dateOnly,
        "time": timeAlso,
        "address": address,
        "workOrder": workOrder,
        "crewId": CrewID,
        "failType": failType,
        "RoWType": RoWType,
        "userComments": userComments,
        "failureCause": failureCause,
        "image": reducedBase64,
        "treeSpecies": finalSpecies
    }
    console.log(jsonData);
    return timeAlso;
}

//Function to store to local DB(WebSQL)
function storeLocal(json, time) {
    try {
        var jstring = JSON.stringify(json);
        var db = openDatabase('mydb', '1.0', 'Test DB', 5 * 1024 * 1024);

        db.transaction(function(tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS TRIMDATA (trimjson,id)');
            tx.executeSql('INSERT INTO TRIMDATA VALUES (?,?)', [jstring, time]);
        });

        return true;
    } catch (exception) {
        console.log(exception);
        return false;
    }
}

//Get all the rows from the Local Store
function getLocalAsJson(callback) {
    try {
        var db = openDatabase('mydb', '1.0', 'Test DB', 5 * 1024 * 1024);
        var msg;

        db.transaction(function(tx) {
            tx.executeSql('SELECT * FROM TRIMDATA', [], function(tx, results) {
                var recordJson;
                var len = results.rows.length;
                var jsonArray = {
                    trimRecords: []
                };

                for (i = 0; i < len; i++) {
                    recordJson = results.rows.item(i).trimjson;
                    var recordId = results.rows.item(i).id;

                    //Add to the JSON Array
                    jsonArray.trimRecords.push(recordJson);
                    //console.log("Inside For Loop : "+JSON.stringify(jsonArray));
                }

                //console.log("Outside For Loop : "+JSON.stringify(jsonArray));
                callback(jsonArray);
            }, null);
        });
    } catch (exception) {
        console.log(exception);
        callback(null);
    }
}

//Get the current date stamp(YYYY-MM-DD)
function getDateStamp() {
    //console.log("Get Date Stamp was called");
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();

    var day = yyyy + "-" + mm + "-" + dd;
    var nowDate = Math.round(new Date(yyyy, mm - 1, dd).getTime() / 1000);
    //console.log("From Get Time Stamp Function : "+nowDate);
    return nowDate;
}

//Get the current Time Stamp
function getTimeStamp() {
    var nowTime = Math.round(new Date().getTime() / 1000);
    return nowTime;
}

//Get Time String
function getTimeString(unixTime) {
    var date = new Date(unixTime * 1000);
    var hours = date.getHours();
    var minutes = "0" + date.getMinutes();
    var seconds = "0" + date.getSeconds();
    var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

    return formattedTime;
}

//Get Date String
function getDateString(unixTime) {
    var date = new Date(unixTime * 1000);
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var day = date.getDate();
    var month = months[date.getMonth()];
    var year = date.getFullYear();

    var formattedDate = month + ", " + day + " " + year;

    return formattedDate;
}

//Store to Cloudant DB
function storeCloudant(jsonToStore, id, check) {
    $.ajax({
        type: "POST",
        //Change the Cloudant URL Here
        url: "https://2a59b99c-9196-4886-8cc6-2ae981f83671-bluemix.cloudant.com/trimtrack",
        data: JSON.stringify(jsonToStore),
        contentType: "application/json",
        success: function(dataString) {
            //alert(jsonToStore);
            if (Boolean(window.openDatabase)) {
                deleteLocalById(id);
                localStorage.setItem("toSync", "false");
            }
            if (check == true) {
                //Send to Success Page
                $("#loadModal").modal('hide');
                window.location = "/success.html";
            } else {
                //Do nothing
                //alert("Storage Success from Sync Data Call");
            }
        },
        error: function(dataString) {
            if (Boolean(window.openDatabase)) {
                localStorage.setItem("toSync", "true");
                if (check == true) {
                    //Send to Offline Storage Alert Page
                    $("#loadModal").modal('hide');
                    window.location = "/failure.html";
                } else {
                    //alert("Storage failed from Sync Data Call and has been added to Sync Queue");
                }
            } else {
                bootbox.alert("Oops! We had an issue storing your data. Please try again later.");
            }
        }
    });
}

//Delete from localStorage with ID
function deleteLocalById(id) {
    try {
        var db = openDatabase('mydb', '1.0', 'Test DB', 5 * 1024 * 1024);
        var msg;

        db.transaction(function(tx) {
            tx.executeSql('DELETE FROM TRIMDATA WHERE id=?', [id]);
            console.log("Record with ID = " + id + " is deleted!");
        });
    } catch (exception) {
        console.log(exception);
    }
}

function syncData(callback) {
    try {
        if (localStorage.getItem("toSync") == "true") {
            console.log("Syncing Data..");
            var db = openDatabase('mydb', '1.0', 'Test DB', 5 * 1024 * 1024);
            var msg;

            db.transaction(function(tx) {
                tx.executeSql('SELECT * FROM TRIMDATA', [], function(tx, results) {
                    var msg = results;
                    var len = results.rows.length;
                    var i;

                    for (i = 0; i < len; i++) {
                        msg = results.rows.item(i).trimjson;
                        var id = results.rows.item(i).id;
                        //alert("1 Record is being Synced");
                        storeCloudant(JSON.parse(msg), id, false);
                    }
                    callback();
                }, null);
            });
        } else {
            //Alert has been put for testing purposes
            //alert("To Sync is false!");
            callback();
        }
    } catch (exception) {
        console.log(exception);
        callback();
    }
}

//Function to get local row count of from the WebSQL DB
function getLocalRowCount(callback) {
    console.log("Local Row Count was called");
    var length;
    try {
        var db = openDatabase('mydb', '1.0', 'Test DB', 5 * 1024 * 1024);
        var msg;
        db.transaction(function(tx) {
            tx.executeSql('SELECT * FROM TRIMDATA', [], function(tx, results) {
                document.getElementById("syncCount").innerHTML = '<span class="badge">' + results.rows.length + '</span>';
                console.log("There are " + results.rows.length + " to be synced!");
                callback(results.rows.length);
            }, null);
        });
    } catch (exception) {
        console.log("Exception with WebSQL : " + exception);
        //Put the alert message in Sync Page saying offline is not supported
        callback(0);
    }
}

//Function to validate input from form fields
//Function to validate multiple input fields
function validateInput(input) {
    var len = input.length;
    if (len > 0) {
        for (var i = 0; i < len; i++) {
            var str = document.getElementById(input[i]).value;
            if (str == "" || str == null) {
                return {
                    "check": false,
                    "field": input[i]
                };
            }
        }
        return {
            "check": true
        };
    }
}

//Time Conversion Methods
function getUnixTime() {
    var unixtime = Math.floor(Date.now() / 1000);
    return unixtime;
}

//Function to convert unix time to UTC string
function toUtcStr(unixtime) {
    var date = new Date(unixtime * 1000);
    var utcDate = date.toUTCString();
    return utcDate;
}

//Function to get appropriate Species List based on selection
function getSpecies(selection) {
    switch (selection) {
        case "Birch":
            return tree.birch;
            break;
        case "Cedar":
            return tree.cedar;
            break;
        case "Fruit":
            return tree.fruit;
            break;
        case "Hickory":
            return tree.hickory;
            break;
        case "Locust":
            return tree.locust;
            break;
        case "Maple":
            return tree.maple;
            break;
        case "Oak":
            return tree.oak;
            break;
        case "Pine":
            return tree.pine;
            break;
        case "Poplar":
            return tree.poplar;
            break;
        case "Spruce":
            return tree.spruce;
            break;
        case "Other":
            return tree.other;
            break;
    }
}
