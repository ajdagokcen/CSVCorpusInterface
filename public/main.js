
var socket = io();
var reader = new FileReader();

var rows = [];
var specs = [];
var delim = ",";
var title = "Corpus Interface";

var display2actual = [];
var searchable = [];
var retrievable = [];

var tries = {};
var dicts = {};

var tables = {
	view: {offset: 0, inc: 15, tot: 0, rows:[]},
	modify: {offset: 0, inc: 1, tot: 0, rows:[]}
}

function changePage(page, newOffset) {
	tables[page].offset = Math.max(0, Math.min(newOffset, tables[page].tot-1));
	$("#"+page+" > table").empty();
	var row = '<tr>';
	for (var j=0; j<Object.keys(specs).length; j++)
		if (specs[j].display) row += '<th>'+specs[j].header+'</th>';
	row += '</tr>'
	$("#"+page+" > table").append(row);
	for (var i=0; i<tables[page].inc; i++) {
		if (tables[page].offset >= 0 && (tables[page].inc*tables[page].offset)+i < tables[page].rows.length) {
			var row = '<tr>';
			for (var j=0; j<Object.keys(specs).length; j++) {
				var dir = 'ltr';
				if (specs[j].rtl) dir = 'rtl';
				if (specs[j].display)
					if (page == "modify" && specs[j].modify)
						row	+= '<td class="'+dir+'" contenteditable>'+rows[tables[page].rows[(tables[page].inc*tables[page].offset)+i]][j] + '</td>';
					else
						row	+= '<td class="'+dir+'">'+rows[tables[page].rows[(tables[page].inc*tables[page].offset)+i]][j] + '</td>';
			}
			row += '</tr>'
			$("#"+page+" > table").append(row);
		}
	}
	$("#"+page+" .pagination").text("Entry "+String(tables[page].offset+1)+" of "+String(tables[page].tot));
}

function arrayify(s) {
	var ret = [];
	for (var i=0; i<s.length; i++)
		if (i>0 && s[i-1]==s[i])
			ret[i-1] += s[i]
		else
			ret.push(s[i])
	return ret;
}

/* position of last shared phoneme */
function getUniquenessIndex(prefix) {
	prefix = arrayify(prefix);
	var ind = 0;
	var node = tries[$("input[name=inputtype]:checked").val()];
	for (var i=0; i<prefix.length; i++) {
		if (prefix[i] in node.next) {
			ind = i;
			node = node.next[prefix[i]];
		} else break;
	}
	return ind;
}

/* count the number of words between min and max distance from given word */
function getNeighborhoodDensity(word, min, max) {
	word = arrayify(word);
	var count = 0;
	var cs = [{ind:0, node:tries[$("input[name=inputtype]:checked").val()], dist:0, word:""}];
	while (cs.length > 0) {
		var _cs = [];
		for (var i=0; i<cs.length; i++) {
			// insertion
			if (cs[i].dist < max)
				for (key in cs[i].node.next)
					_cs.push({ind:cs[i].ind, node:cs[i].node.next[key], dist:cs[i].dist+1, word:cs[i].word+key});
			if (cs[i].ind < word.length) {
				// substitution
				if (cs[i].dist < max)
					for (key in cs[i].node.next)
						if (key != word[cs[i].ind])
							_cs.push({ind:cs[i].ind+1, node:cs[i].node.next[key], dist:cs[i].dist+1, word:cs[i].word+key});
				// equality
				if (word[cs[i].ind] in cs[i].node.next)
					_cs.push({ind:cs[i].ind+1, node:cs[i].node.next[word[cs[i].ind]], dist:cs[i].dist, word:cs[i].word+word[cs[i].ind]});
				// deletion
				if (cs[i].dist < max)
					_cs.push({ind:cs[i].ind+1, node:cs[i].node, dist:cs[i].dist+1, word:cs[i].word});
			} else if (cs[i].node.word && cs[i].dist >= min && cs[i].dist <= max)
				count++;
		}
		cs = _cs;
	}
	return count;
}

$(document).ready(function() {
	socket.emit("db_req", {});
	socket.on("db_res", function(data) {
		rows = data.rows;
		specs = data.specs;
		delim = data.delim;
		title = data.title;
		$("#title").text(title);
		for (var j=0; j<Object.keys(specs).length; j++) {
			if (specs[j].display) display2actual.push(j);
			if (specs[j].search) {
				searchable.push(j);
				tries[j] = {next:{}, word:false};
				dicts[j] = {};
				if ($("#formats > .buttons").html().trim() == '')
					$("#formats > .buttons").append('<input type="radio" name="inputtype" value='+j+' id="'+specs[j].header+'" checked/>' + '<label for="'+specs[j].header+'">'+specs[j].longname+'</label>');
				else
					$("#formats > .buttons").append('<input type="radio" name="inputtype" value='+j+' id="'+specs[j].header+'"/>' + '<label for="'+specs[j].header+'">'+specs[j].longname+'</label>');
			}
			if (specs[j].retrieve) {
				retrievable.push(j);
				$("#queries > .buttons:first").append('<input type="checkbox" name="querytype" value='+j+' id="'+specs[j].header+'"/>' + '<label for="'+specs[j].header+'">Get '+specs[j].longname+'</label>');
			}
		}
		if (specs[$("input[type=radio][name=inputtype]").val()].rtl)
			$("#input > .textarea").addClass("rtl");
		else
			$("#input > .textarea").addClass("ltr");
		for (var i=0; i<rows.length; i++) {
			for (var form of searchable) {
				var node = tries[form];
				var word = arrayify(rows[i][form]);
				for (var j=0; j<word.length; j++) {
					if (!(word[j] in node.next))
						node.next[word[j]] = {"next":{}, "word":false};
					if (j == word.length-1)
						node.next[word[j]].word = true;
					node = node.next[word[j]];
				}
				if (!(rows[i][form] in dicts[form])) dicts[form][rows[i][form]] = [];
				dicts[form][rows[i][form]].push(i);
			}
			tables.view.rows.push(i);
			for (var j of display2actual) {
				if (rows[i][j] == "not_found" || rows[i][j].length == 0) {
					rows[i][j] = "";
					tables.modify.rows.push(i);
					break;
				}
			}
		}
		tables.view.tot = Math.ceil(tables.view.rows.length / tables.view.inc);
		tables.modify.tot = Math.ceil(tables.modify.rows.length / tables.modify.inc);
		changePage("view", 0);
		changePage("modify", 0);
	});
});

$(document).on("click", "header > .buttons > button", function(event) {
	$("#page > *").hide();
	$("#page > #"+$(this).attr("data-page")).show();
});

$(document).on("click", ".first", function(event) {
	changePage($(this).parent().parent().attr("id"), 0);
});

$(document).on("click", ".prev", function(event) {
	var page = $(this).parent().parent().attr("id");
	changePage(page, tables[page].offset-1);
});

$(document).on("click", ".next", function(event) {
	var page = $(this).parent().parent().attr("id");
	changePage(page, tables[page].offset+1);
});

$(document).on("click", ".last", function(event) {
	var page = $(this).parent().parent().attr("id");
	changePage(page, tables[page].tot-1);
});

$(document).on("change", "input[type=\"file\"]", function(event) {
	if ($(this).get(0).files[0]) {
		reader.readAsText($(this).get(0).files[0]);
		$(reader).on("load", function(event) {
			var file = event.target.result;
			if (file && file.length)
				$("#input > .textarea").text(file);
		});
	}
});

$(document).on("change", "input[type=radio][name=inputtype]", function(event) {
	if (specs[$(this).val()].rtl) {
		$("#input > .textarea").removeClass("ltr");
		$("#input > .textarea").addClass("rtl");
	} else {
		$("#input > .textarea").removeClass("rtl");
		$("#input > .textarea").addClass("ltr");
	}
});

$(document).on("click", "#submit", function(event) {
	//var delim = ","; //"\t";
	var inputtype = $("input[name=inputtype]:checked").val();
	$("#output > .textarea").empty();
	//var lines = $("#input > .textarea").text().trim().split("\n");
	//var lines = $("#input > .textarea").html().trim().split(/(\r|\n|\<\/?div\>)+/);
	var lines = $("#input > .textarea").html().trim().replace(/(\<\/div\>)?\<div\>/gi, "\n").replace(/\<\/div\>/gi, "").split(/[\r\n]/);
	var output = "";
	output += "input" + delim + "in_corpus";
	$("input[name=querytype]:checked").each(function(index) {
		if ($(this).val() == "nd" || $(this).val() == "up")
			output += delim + $(this).val();
		else
			output += delim + specs[$(this).val()].header;
	});
	for (var i=0; i<lines.length; i++) {
		if (lines[i] in dicts[inputtype]) {
			for (var j=0; j<dicts[inputtype][lines[i]].length; j++) {
				output += "\n" + lines[i] + delim + "1";
				$("input[name=querytype]:checked").each(function(index) {
					output += delim;
					if ($(this).val() == "nd") {
						output += String(getNeighborhoodDensity(lines[i], 1, 1));
					} else if ($(this).val() == "up") {
						output += String(getUniquenessIndex(lines[i]));
					} else {
						for (var k of retrievable)
							if ($(this).val() == k)
								output += rows[dicts[inputtype][lines[i]][j]][k];
					}
				});
			}
		} else {
			output += "\n" + lines[i] + delim + "0";
			$("input[name=querytype]:checked").each(function(index) {
				output += delim;
				if ($(this).val() == "nd") {
					output += String(getNeighborhoodDensity(lines[i], 1, 1));
				} else if ($(this).val() == "up") {
					output += String(getUniquenessIndex(lines[i]));
				} else {
					for (var k of retrievable)
						if ($(this).val() == k)
							output += "not_found";
				}
			});
		}
	}
	$("#output > .textarea").append(output);
});

$(document).on("click", ".save", function(event) {
	var filename = prompt("File name:", "");
	if (filename !== null) {
		console.log(filename);
		filename = "saved/" + filename;
		var content = $(this).parent().parent().children(".textarea").text(); //val();
		socket.on(filename, function(data) {
			window.location.href = filename;
		});
		socket.emit('save', {filename: filename, content: content});
	}
});

$(document).on("click", ".clear", function(event) {
	$(this).parent().parent().children(".textarea").empty();
});

$(document).on("blur", "#modify > table > tr > td", function(event) {
	if (rows[tables.modify.rows[tables.modify.offset + $(this).parent().index() - 1]][display2actual[$(this).index()]] != $(this).text()) {
		rows[tables.modify.rows[tables.modify.offset + $(this).parent().index() - 1]][display2actual[$(this).index()]] = $(this).text();
		socket.emit('modify', {row:tables.modify.rows[tables.modify.offset + $(this).parent().index() - 1], col:display2actual[$(this).index()], val:$(this).text()});
	}
});

