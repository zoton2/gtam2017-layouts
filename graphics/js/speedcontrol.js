'use strict';
$(function() {
	// The name of the speedcontrol bundle that's used whenever a replicant or message needs to be used.
	var speedcontrolBundle = 'nodecg-speedcontrol';
	
	// jQuery selector initialisation.
	var $sceneID = $('html').attr('data-sceneid');
	var $timerInfo = $('#timer');  // maybe change name
	var $runInformationName = $('#runInformationGameName');
	var $runInformationCategory = $('#runInformationGameCategory');
	var $runInformationEstimate = $('#runInformationGameEstimate');
	var $runComingUpInformationName = $('#comingUpGame');
	var $runnerLogo = $('.runnerLogo');
	var $runnerInfoElements = $('.runnerInfo');
	var $donationTotal = $("#donationTotal");
    var $runnerTimerFinishedElements = $('.runnerTimerFinished')
    var $runnerTimerFinishedContainers = $('.runnerTimerFinishedContainer');
	// to go here as needed
	
	// Declaring variables.
	var currentTime = '';
	var displayTwitchForMS = 15000;
	var displayNameforMS = 120000;
	var timeoutName;
	var donationInit = false;
	
	// NodeCG message subscription.
	nodecg.listenFor('resetTime', speedcontrolBundle, resetAllPlayerTimers);
	nodecg.listenFor('timerReset', speedcontrolBundle, resetTimer);
	nodecg.listenFor('timerSplit', speedcontrolBundle, splitTimer);
	
	// NodeCG replicants.
	var stopWatchReplicant = nodecg.Replicant('stopwatch', speedcontrolBundle);
	var runDataArrayReplicant = nodecg.Replicant('runDataArray', speedcontrolBundle);
	var runDataActiveRunReplicant = nodecg.Replicant('runDataActiveRun', speedcontrolBundle);
	var g4gDonationTotalReplicant = nodecg.Replicant('g4gDonationTotal', speedcontrolBundle, {persistent: false, defaultValue: '0.00'});
	
	// Replicant used to update the timer.
	stopWatchReplicant.on('change', function(newValue, oldValue) {
		if (!newValue) return;
		var time = newValue.time || '88:88:88';
		if (oldValue) $timerInfo.toggleClass('timer_' + oldValue.state, false);
		$timerInfo.toggleClass('timer_' + newValue.state, true);
		
		// Sets the current time of the timer.
		$timerInfo.html(time);
		currentTime = time;
	});
	
	// Replicant used to update the run details.
	runDataActiveRunReplicant.on('change', function(newValue, oldValue) {
		// Check if there is actually a run to get information about.
		if (newValue && newValue !== '') {
			// runID is 1 > X but this is an array which is 0 > X hence this might look weird to some people.
			var indexOfCurrentRun = findIndexInDataArrayOfRun(newValue, runDataArrayReplicant.value);
			var indexOfNextRun = Number(indexOfCurrentRun) + Number(1);
			var comingUpRun = undefined;
			if(indexOfNextRun >= runDataArrayReplicant.value.length) {
			}
			else {
				comingUpRun = runDataArrayReplicant.value[indexOfNextRun];
			}
			
			// Set parts of the layout with the correct text, this will probably need breaking off and need animations.
			$runInformationName.html(newValue.game);
			$runInformationCategory.html(newValue.category);
			$runInformationEstimate.html(newValue.estimate);
			$runComingUpInformationName.html(comingUpRun.game);
			
			// Clear all the runner info boxes before putting new info in them.
			$runnerInfoElements.each(function(index, element) {
				$(element).html('');
			});
			
			var players = [];
			
			console.log(newValue.teams);
			
			if (newValue.teams.length > 1) {
				newValue.teams.forEach(function(team) {
					players.push(team.members[0].names.international);
				});
			}
			
			else if (newValue.teams.length === 1) {
				newValue.teams[0].members.forEach(function(member) {
					players.push(member.names.international);
				});
			}
			
			$runnerInfoElements.each(function(index, element) {
				if (!players[index]) return false;  // Breaks out of this loop if we've reached the end.
				var playerInfo = players[index];
				$(element).html(playerInfo);
			});
			
			
			/*else {
				if (newValue.players[0]) {
					var playerName = newValue.players[0].names.international;
					var playerTwitch = newValue.players[0].twitch.uri;
					playerTwitch = playerTwitch.substr(playerTwitch.lastIndexOf('/')+1);  // Remove start twitch.tv URL hack
					
					$('#runnerInfo1Name').html(playerName);
					$('#runnerInfo1Twitch').html(playerTwitch);
				}
			}*/
		}
	});
	
	function findIndexInDataArrayOfRun(run, runDataArray) {
        var indexOfRun = -1;
        $.each(runDataArray, function (index, value) {
            if(value.runID == run.runID) {
                indexOfRun = index;
            }
        });
        return indexOfRun;
    }
	
	// Used to toggle player text between name and Twitch.
	// type: false - name, true - twitch
	function togglePlayerText(runData, type) {
		clearTimeout(timeoutName);
		
		// Switch name/twitch logos.
		if (!type) $runnerLogo.switchClass('twitchLogo', 'nameLogo');
		else $runnerLogo.switchClass('nameLogo', 'twitchLogo');
		
		// Loops through each runnerInfo on the page and inserts the correct player.
		$runnerInfoElements.each(function(index, element) {
			if (!runData.players[index]) return false;  // Breaks out of this loop if we've reached the end.
			var playerInfo = (type) ? runData.players[index].twitch.uri : runData.players[index].names.international;
			if (type) {
				playerInfo = playerInfo.substr(playerInfo.lastIndexOf('/')+1);  // Remove start twitch.tv URL hack
			}
			$(element).html(playerInfo);
		});
		
		// Set a timeout to do the next toggle.
		var timeoutLength = (type) ? displayTwitchForMS : displayNameforMS;
		timeoutName = setTimeout(function() {togglePlayerText(runData, !type);}, timeoutLength);
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
	
	function resetAllPlayerTimers() {
		$runnerTimerFinishedElements.each(function(index, element) {
			$(this).html('');
			hideTimerFinished(index);
		});
	}
	
	function hideTimerFinished(index) {
		$runnerTimerFinishedContainers.eq(index).css('opacity','0');
	}
	
	function resetTimer(index) {
		$runnerTimerFinishedElements.eq(index).html('');
		hideTimerFinished(index);
    }
	
    function splitTimer(index) {
		$runnerTimerFinishedElements.eq(index).html(currentTime);
		//animation_fadeInOpacity($runnerTimerFinishedContainers.eq(index));
		$runnerTimerFinishedContainers.eq(index).css('opacity','1');
    }
	
	$runnerTimerFinishedElements.each(function(index, e){
		hideTimerFinished(index);
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