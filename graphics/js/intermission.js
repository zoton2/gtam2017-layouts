'use strict';
$(function() {
	// The name of the speedcontrol bundle that's used whenever a replicant or message needs to be used.
	var speedcontrolBundle = 'nodecg-speedcontrol';
	
	// jQuery selector initialisation.
	var $donationTotal = $("#donationTotal");
	
	var $comingUpGame = $('#comingUpGame');
    var $comingUpCategory = $('#comingUpCategory');
    var $comingUpPlayer = $('#comingUpPlayer');

    var $justMissedGame = $('#justMissedGame');
    var $justMissedCategory = $('#justMissedCategory');
    var $justMissedPlayer = $('#justMissedPlayer');
	
	// Declaring variables.
	var donationInit = false;
	var marqueeTimeout;
	var isInitialized = false;
	
	// NodeCG Message subscription ###
    nodecg.listenFor("displayMarqueeInformation", speedcontrolBundle, function(text) {displayMarquee(text);});
    nodecg.listenFor("displayMarqueeInformationTemp", speedcontrolBundle, function(text) {displayMarquee(text, 30);});
    nodecg.listenFor("removeMarqueeInformation", speedcontrolBundle, removeMarquee);
	
	// NodeCG replicants.
	var g4gDonationTotalReplicant = nodecg.Replicant('g4gDonationTotal', speedcontrolBundle, {persistent: false, defaultValue: '0.00'});
	var runDataArrayReplicant = nodecg.Replicant("runDataArray", speedcontrolBundle);
	
	var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun", speedcontrolBundle);
    runDataActiveRunReplicant.on("change", function (newValue, oldValue) {
        if(typeof newValue == 'undefined' || newValue == "") {
            return;
        }

        var indexOfCurrentRun = findIndexInDataArrayOfRun(newValue, runDataArrayReplicant.value);
        var indexOfNextRun = Number(indexOfCurrentRun) + Number(1);
        var comingUpRun = undefined;
        if(indexOfNextRun >= runDataArrayReplicant.value.length) {
        }
        else {
            comingUpRun = runDataArrayReplicant.value[indexOfNextRun];
        }
        if(!isInitialized) {
            updateMissedComingUp(newValue, comingUpRun);
            isInitialized = true;
        }
    });
	
	function updateMissedComingUp(currentRun, nextRun) {
        changeComingUpRunInformation(nextRun);
        changeJustMissedRunInformation(currentRun);
    }
	
    function findIndexInDataArrayOfRun(run, runDataArray) {
        var indexOfRun = -1;
        $.each(runDataArray, function (index, value) {
            if(value.runID == run.runID) {
                indexOfRun = index;
            }
        });
        return indexOfRun;
    }
	
	// Replicant functions ###
    function changeComingUpRunInformation(runData) {
        var game = "END";
        var category = "";
		var player = '';

        if(typeof runData !== "undefined" && runData !== '') {
            game = runData.game;
            category =  runData.category;
			player = formatPlayerText(runData);
        }

		$comingUpGame.html(game);
		$comingUpCategory.html(category);
		$comingUpPlayer.html(player);
    }

    function changeJustMissedRunInformation(runData) {
        var game = "START";
        var category = "";
		var player = '';

        if(typeof runData !== "undefined" && runData !== '') {
            game = runData.game;
            category =  runData.category;
			player = formatPlayerText(runData);
        }

		$justMissedGame.html(game);
		$justMissedCategory.html(category);
		$justMissedPlayer.html(player);
    }
	
	function formatPlayerText(runData) {
		var player = '';
		
		console.log(runData.players.length);
		console.log(runData.teams.length);
		
		if (runData.players.length >= 2) {
			if (runData.teams.length === 1) {
				player = 'Co-Op Run';
			}
			
			else {
				player = 'Race';
			}
		}
		
		else {
			player = runData.players[0].names.international;
		}
		
		return player;
	}
	
	g4gDonationTotalReplicant.on('change', function(newValue, oldValue) {
		// If the page has just been loaded, just print the current value.
		if (!donationInit) {
			$donationTotal.html('$' + parseFloat(newValue).toFixed(2));
			donationInit = true;
		}
		
		else {
			animation_updateDonationTotal($donationTotal, oldValue, newValue);
		}
	});
	
    function displayMarquee(text, seconds) {
        $('#informationMarquee').html(text);
		$('#informationMarquee').css('opacity', '1');
        var tm = new TimelineMax({paused: true});
        tm.to($('#informationMarquee'), 1.0, {opacity: '1', top: "671px",  ease: Bounce.easeOut },'0');
        tm.play();
		if (seconds) {marqueeTimeout = setTimeout(removeMarquee, seconds*1000);}
    }

    function removeMarquee() {
		clearTimeout(marqueeTimeout);
        var tm = new TimelineMax({paused: true});
        tm.to($('#informationMarquee'), 1.0, {opacity: '1', top: "720px",  ease: Bounce.easeOut , onComplete:function() {
			$('#informationMarquee').css('opacity', '0');
		}},'0');
        tm.play();
    }
	
	// force refresh intermission copied from esa2016
	nodecg.listenFor("forceRefreshIntermission", speedcontrolBundle, function() {
		isInitialized = false;
       if(typeof runDataActiveRunReplicant.value == 'undefined' || runDataActiveRunReplicant.value == "") {
           //return;
       }
        var indexOfCurrentRun = findIndexInDataArrayOfRun(runDataActiveRunReplicant.value, runDataArrayReplicant.value);
       var indexOfNextRun = Number(indexOfCurrentRun) + Number(1);
       var comingUpRun = undefined;
       if(indexOfNextRun >= runDataArrayReplicant.value.length) {
       }
       else {
           comingUpRun = runDataArrayReplicant.value[indexOfNextRun];
       }
       if(!isInitialized) {
           updateMissedComingUp(runDataActiveRunReplicant.value, comingUpRun);
           isInitialized = true;
       	}
	});
	
	// Source: http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
	/*function numberWithCommas(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}*/
	
	function animation_updateDonationTotal($selector, oldTotal, newTotal) {
		var decimal_places = 2;
		var decimal_factor = decimal_places === 0 ? 1 : Math.pow(10, decimal_places);

		$selector
		  .prop('number', parseFloat(oldTotal) * decimal_factor)
		  .animateNumber(
			{
			  number: parseFloat(newTotal) * decimal_factor,

			  numberStep: function(now, tween) {
				var floored_number = Math.floor(now) / decimal_factor,
					target = $(tween.elem);

				if (decimal_places > 0) {
				  // force decimal places even if they are 0
				  floored_number = floored_number.toFixed(decimal_places);
				}

				target.text('$' + floored_number);
			  }
			},
			5000
		  );
	}
});