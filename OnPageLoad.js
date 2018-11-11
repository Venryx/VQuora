Array.prototype.Last = function() { return this[this.length - 1]; };

var VQuora = new function () {
	var self = this;
	self.taggedAnswerCount = 0;

	// methods
	// ==========

	self.GetAnswerBoxHolder = function () {
		return $(".AnswerPagedList, .UnifiedAnswerPagedList").children(".paged_list_wrapper")[0];
	};
	self.GetAnswerBoxes = function () {
		if (self.GetAnswerBoxHolder() == null) return [];
		return Array.from(self.GetAnswerBoxHolder().children).filter(a=>a.querySelector(".Answer:not(.ActionBar)"));
	};
	self.GetCollapsedAnswerBoxes = function () {
		if (self.GetAnswerBoxHolder() == null) return [];
		return Array.from(self.GetAnswerBoxHolder().children).filter(a=>a.querySelector(".Answer:not(.ActionBar)") == null);
	};
	self.RefreshAnswerTags = function () {
		var answerBoxes = self.GetAnswerBoxes();
		for (let box of answerBoxes) {
			if (box.originalIndex != null) continue; // if already processed, skip
			box.originalIndex = self.taggedAnswerCount; //box[0].originalIndex != null ? box[0].originalIndex : box.parents(".pagedlist_item").index();

			//var upvoteCountLabel = box.find(`[action_click="AnswerUpvote"] `); //.find(".vote_item_link.add_upvote .count");
			var upvoteCountLabel = box.querySelector(".ui_button_count_static, .ui_button_count_optimistic_count");
			if (upvoteCountLabel) {
				box.votes = upvoteCountLabel.innerText.indexOf(".") != -1 || upvoteCountLabel.innerText.indexOf("k") != -1
					? parseFloat(upvoteCountLabel.innerText) * 1000
					: parseInt(upvoteCountLabel.innerText);
			} else {
				box.votes = 0;
			}

			var dateText = box.querySelector(".answer_permalink").innerText.replace("Written ", "").replace("Updated ", "") + " " + new Date().getFullYear();
			var date;
			if (dateText.indexOf("ago") != -1) {
				date = new Date();
				if (dateText.indexOf("m ago") != -1) {
					date.setMinutes(date.getMinutes() - parseInt(dateText));
				} else {
					date.setHours(date.getHours() - parseInt(dateText));
				}
			} else if (dateText.indexOf("am") != -1 || dateText.indexOf("pm") != -1) {
				date = new Date();
				date.setHours(parseInt(dateText));
			} else {
				var dayOfWeekName = null;
				var nameToNumberMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
				for (var name in nameToNumberMap) {
					if (dateText.indexOf(name) != -1) {
						dayOfWeekName = name;
					}
				}
				if (dayOfWeekName) {
					date = new Date();
					while (date.getDay() != nameToNumberMap[dayOfWeekName]) {
						date.setDate(date.getDate() - 1);
					}
				} else {
					date = new Date(dateText);// || new Date();
				}
			}
			box.date = date.getTime();

			//box.parents(".pagedlist_item").attr("originalIndex", box.originalIndex).attr("votes", box.votes).attr("dateText", dateText).attr("date", date);
			$(box).attr("originalIndex", box.originalIndex).attr("votes", box.votes).attr("dateText", dateText).attr("date", date); // for debugging
			self.taggedAnswerCount++;
		}
	};
	self.SortAnswerBoxes = function (type) {
		var answerBoxes = self.GetAnswerBoxes();
		self.RefreshAnswerTags();

		if (type == "magic") {
			answerBoxes.sort(function (a, b) { return a.originalIndex < b.originalIndex ? -1 : (a.originalIndex == b.originalIndex ? 0 : 1); });
		} else if (type == "votes") {
			answerBoxes.sort(function (a, b) { return a.votes < b.votes ? -1 : (a.votes == b.votes ? 0 : 1); });
			answerBoxes.reverse();
		} else if (type == "date") {
			answerBoxes.sort(function (a, b) { return a.date < b.date ? -1 : (a.date == b.date ? 0 : 1); });
			answerBoxes.reverse();
		}

		for (var i = 0; i < answerBoxes.length; i++) {
			var box = answerBoxes[i];
			//$(box).parents(".pagedlist_item").insertAfter(self.GetAnswerBoxes().Last());
			$(box).insertAfter(self.GetAnswerBoxes().Last());
		}

		// put collapsed-answers-box at end
		for (let box of self.GetCollapsedAnswerBoxes()) {
			$(box).insertAfter(self.GetAnswerBoxes().Last());
		}
	};
	self.ShowAllAnswers = function () {
		var totalAnswers = parseInt($(".answer_count").text());
		var answerBoxHolder = self.GetAnswerBoxHolder();
		if (answerBoxHolder == null) alert("Cannot find answers container.");

		/*var loaderBar = answerBoxHolder.children(":not(.pagedlist_item)");
		var loaderDiv = $(".pager_sentinel");

		// there is a "sentinel" element which loads more content when it's in view
		// force it to be in view temporarily by moving it into an in-view fixed-position container
		var tempHolder = $("<div style='position: fixed; left: 0; top: 0; opacity: 0;'></div>").appendTo("body");
		loaderDiv.appendTo(tempHolder);*/

		// collapsing the answer-box-holder makes site think we're at end of list, causing it to keep loading more
		answerBoxHolder.style.height = 0;
		
		let timerID = setInterval(()=> {
			//answerBoxHolder.children(":not(.pagedlist_item)").insertBefore(answerBoxHolder.children(".pagedlist_item").first());

			$(document).scrollTop($(document).scrollTop() + 1);
			$(document).scrollTop($(document).scrollTop() - 1);
			
			//var shownCount = answerBoxHolder.children().filter(function() { return $(this).find(".Answer:not(.ActionBar)").length >= 1; }).length; //$(".Answer").length;
			var shownCount = self.GetAnswerBoxes().length;
			$("#shownCount").html("SHOWN: " + shownCount);

			if (shownCount >= totalAnswers) { //$(".pagedlist_item_hidden").length)
				/*loaderDiv.appendTo(loaderBar);
				tempHolder.remove();*/
				answerBoxHolder.style.height = null;
				clearInterval(timerID);
			}
		}, 500);
	};

	// startup
	// ==========

	$(function () {
		var header = $(".QuestionPageAnswerHeader > div");
		var headerExtras = $("<div style='display: inline-block; vertical-align: middle;'>").appendTo(header);
		$("<div style='float: left; margin-left: 5px; font-size: 12px;'>| SORT BY:</div>").appendTo(headerExtras);
		var sortBox = $("<select style='float: left; margin-left: 10px; margin-top: -2px; font-size: 12px;'><option>magic</option><option>votes</option><option>date</option></select>").appendTo(headerExtras);
		sortBox.change(function () {
			self.SortAnswerBoxes(sortBox.val());
		});
		var showAll = $("<button style='float: left; margin-left: 5px; margin-top: -3px; font-size: 12px;'>Show All</button>").appendTo(headerExtras);
		showAll.click(function () { self.ShowAllAnswers(); });
		$("<div id='shownCount' style='float: left; margin-left: 5px; font-size: 12px;'></div>").appendTo(headerExtras);
	});
};