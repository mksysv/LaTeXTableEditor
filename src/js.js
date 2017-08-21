function $id(id) {
	return document.getElementById(id);
}
(function() {
	"use strict"
	var sameHeader = function(cellHeader, colHeader, rowN) {
			if (rowN !== 0) {
				colHeader = (/[a-z].*/i.exec(colHeader) || ["l"])[0];
			}
			return cellHeader == colHeader
		},
		table = new(function() {
			this.version = "0.3";
			this.create = function(cols, rows) {
				rows = parseInt(rows, 10);
				cols = parseInt(cols, 10);
				var fr = document.createDocumentFragment();
				for (var i = 0; i < rows; i++) {
					fr.appendChild(this.createRow(cols));
				}
				this.element.innerHTML = "";
				this.element.appendChild(fr);
			};
			this.importData = function(content, format){
				content = content || $id("import_value").value;
				format = (format || $id("import_format").value).toLowerCase();
				if(format == "auto"){
					var json;
					if(/(\\begin{|\\halign|\\valign)/.test(content)){
						try{
							this.importFromJSON(this.latex.importTable(content));
						}
						catch(e){
							try{
								this.importFromJSON(JSON.parse(content))
							}
							catch(f){
								alert("Your file was detected as LaTeX but could not be loaded.");
								if(window.console){
									console.error(e);
								}
							}
						}
					}
					else{
						try{
							json = JSON.parse(content);
						}
						catch(e){
							try{
								json = this.importCSV(content);
							}
							catch(f){
								alert("Your file could not be loaded");
								if(window.console){
									console.error(e);
									console.error(f);
								}
								return false;							
							}
						}
						this.importFromJSON(json);
					}
				}
				else if(format == "json"){
					this.importFromJSON(JSON.parse(content));
				}
				else if(format == "latex"){
					this.importFromJSON(table.latex.importTable(content));
				}
				else if(format == "csv"){
					this.importFromJSON(this.importCSV(content));
				}
			}
			this.removeAllSelection = function() {
				this.selectedCell = null;
				var allSelected = document.querySelectorAll("#table td[data-selected]");
				for (var i = 0, l = allSelected.length; i < l; i++) {
					allSelected[i].removeAttribute("data-selected");
				}
			}
			this.forEachSelectedCell = function(fn) {
				var allCells = document.querySelectorAll("#table td[data-selected]");
				for (var i = 0, l = allCells.length; i < l; i++) {
					if (fn(allCells[i], i) === false) {
						break;
					}
				}
			}
			this.separators = function(hm) {
				$id("info_diag_zero")
					.classList.remove("active");
				$id("info_diag_one")
					.classList.remove("active");
				$id("info_diag_two")
					.classList.remove("active");
				if (hm == 2) {
					$id("info_diag_two")
						.classList.add("active");
					this.twoDiagonals();
				} else if (hm == 1) {
					$id("info_diag_one")
						.classList.add("active");
					this.diagonal();
				} else {
					$id("info_diag_zero")
						.classList.add("active");
					this.forEachSelectedCell(function(cell) {
						if (cell.hasAttribute("data-two-diagonals")) {
							var toDel = cell.querySelector("div[contenteditable]");
							cell.setAttribute("data-two-diagonals-data", toDel.innerHTML);
							toDel.parentElement.removeChild(toDel);
						}
						if (cell.hasAttribute("data-two-diagonals") || cell.hasAttribute("data-diagonal")) {
							var toDel = cell.querySelector("div[contenteditable]:last-child");
							cell.setAttribute("data-diagonal-data", toDel.innerHTML);
							toDel.parentElement.removeChild(toDel);
						}
						cell.removeAttribute("data-two-diagonals");
						cell.removeAttribute("data-diagonal");
					});
				}
			}
			this.interpreters = {};
			this.createInterpreter = function(format, fn) {
				this.interpreters[format] = fn;
			}
			this.interpret = function(format) {
				document.getElementById('c')
					.value = this.interpreters[format].call(this);
			}
			this.insertRowUnder = function(cell) {
				cell = cell || this.selectedCell;
				if (!cell) {
					return false;
				}
				var position = this.Table.position(cell),
					y = -1;
				if (position) {
					y = position.y + cell.rowSpan;
				}
				var _this = this;
				this.Table.insertRow(y, function(cell) {
					_this.applyToCell(cell)
				});
			}
			this.insertRowOver = function(cell) {
				cell = cell || this.selectedCell;
				if (!cell) {
					return false;
				}
				var position = this.Table.position(cell),
					y = 0;
				if (position) {
					y = Math.max(position.y, 0);
				}
				var _this = this;
				this.Table.insertRow(y, function(cell) {
					_this.applyToCell(cell)
				});
			}
			this.insertColBefore = function(cell) {
				cell = cell || this.selectedCell;
				if (!cell) {
					return false;
				}
				var position = this.Table.position(cell),
					x = 0;
				if (position) {
					x = Math.max(position.x, 0);
				}
				var _this = this;
				this.Table.insertCol(x, function(cell) {
					_this.applyToCell(cell)
				});
			}
			this.insertColAfter = function(cell) {
				cell = cell || this.selectedCell;
				if (!cell) {
					return false;
				}
				var position = this.Table.position(cell),
					x = 0;
				if (position) {
					x = position.x + cell.colSpan;
				}
				var _this = this;
				this.Table.insertCol(x, function(cell) {
					_this.applyToCell(cell)
				});
			}
			this.split = function() {
				var _this = this;
				this.Table.split(document.querySelectorAll("#table td[data-selected]"), function(cell) {
					_this.applyToCell(cell)
				});
			}
			this.createCellLike = function(cell) {
				var td = this.createCell();
				td.rowSpan = cell.rowSpan;
				td.colSpan = cell.colSpan;
				for (var i in cell.dataset) {
					td.dataset[i] = cell.dataset[i];
				}
				td.removeAttribute("data-selected");
				return td;
			}
			this.diagonal = function() {
				this.updateLaTeXInfoCell();
				this.forEachSelectedCell(function(cell) {
					if (!cell.hasAttribute("data-diagonal")) {
						if (cell.hasAttribute("data-two-diagonals")) {
							var toDel = cell.querySelector("div[contenteditable]");
							cell.setAttribute("data-two-diagonals-data", this.getHTML(cell));
							toDel.parentElement.removeChild(toDel);
							cell.removeAttribute("data-two-diagonals");
						} else {
							cell.querySelector(".outer")
								.innerHTML += "<div contenteditable>" + (cell.getAttribute("data-diagonal-data") || "[TEXT UNDER]") +
								"</div>";
						}
						cell.setAttribute("data-diagonal", "data-diagonal")
					}
				});
			}
			this.twoDiagonals = function() {
				this.updateLaTeXInfoCell();
				this.forEachSelectedCell(function(cell) {
					if (!cell.hasAttribute("data-two-diagonals")) {
						var div = cell.querySelector(".outer");
						if (cell.hasAttribute("data-diagonal")) {
							cell.removeAttribute("data-diagonal");
							div.innerHTML = "<div contenteditable>" + (cell.getAttribute("data-two-diagonals-data") || "[1]") +
								"</div>" + div.innerHTML;
						} else {
							div.innerHTML = "<div contenteditable>" + (cell.getAttribute("data-two-diagonals-data") || "[1]") +
								"</div>" + div.innerHTML + "<div contenteditable>" + (cell.getAttribute("data-diagonal-data") ||
									"[3]") + "</div>";
						}
						cell.setAttribute("data-two-diagonals", "data-two-diagonals");
					}
				});
			}
			this.rotate = function(state) {
				this.forEachSelectedCell(function(cell) {
					if (state) {
						cell.setAttribute("data-rotated", "data-rotated");
					} else {
						cell.removeAttribute("data-rotated");
					}
				});
				if(state){
					$id("info-unrotated").classList.remove("active");
					$id("info-rotated").classList.add("active");
				}
				else{
					$id("info-unrotated").classList.add("active");
					$id("info-rotated").classList.remove("active");
				}
				this.updateLaTeXInfoCell();
			}
			this.selectedCell = null;
			this.merge = function() {
				var _this = this;
				this.Table.merge(document.querySelectorAll("#table td[data-selected]"), function(colspan, rowspan, keep, removed) {
					var html = _this.getHTML(keep);
					for (var i = 0; i < removed.length; i++) {
						html += " " + _this.getHTML(removed[i])
					}
					_this.setHTML(keep, html);
				});
			}
			this.getCellPosition = function(_cell) {
				var table = this.element,
					occupied = [],
					rows = table.rows;
				for (var i = 0; i < rows.length; i++) {
					occupied.push([]);
				}
				for (var i = 0; i < rows.length; i++) {
					var cols = rows[i].cells,
						realcount = 0;
					for (var j = 0; j < cols.length; j++) {
						var cell = cols[j];
						if (occupied[i][realcount]) {
							j--;
							realcount++;
							continue;
						}
						if (cell == _cell) {
							return {
								x: i,
								y: realcount
							}
						}
						for (var h = 1; h < cell.rowSpan; h++) {
							for (var g = 0; g < cell.colSpan; g++) {
								occupied[i + h][realcount + g] = true;
							}
						}
						realcount += cell.colSpan;
					}
				}

			}
			this.getCellByPosition = function(x, y) {
				var table = this.element,
					occupied = [],
					rows = table.rows;
				if (x >= rows.length) {
					return null;
				}
				for (var i = 0; i < rows.length; i++) {
					occupied.push([]);
				}
				for (var i = 0, l = Math.min(rows.length, x + 1); i < l; i++) {
					var cols = rows[i].cells,
						realcount = 0;
					for (var j = 0; j < cols.length; j++) {
						var cell = cols[j];
						if (occupied[i][realcount]) {
							j--;
							realcount++;
							continue;
						}
						if (i == x && realcount == y) {
							return cell;
						}
						for (var h = 1; h < cell.rowSpan; h++) {
							for (var g = 0; g < cell.colSpan; g++) {
								occupied[i + h][realcount + g] = true;
							}
						}
						realcount += cell.colSpan;
					}
				}
			};
			this.unselectCells = function(group) {
				for (var i = 0; i < group.length; i++) {
					group.removeAttribute("data-selected");
				}
			}
			this.setMargin = function(left, value) {
				this.forEachSelectedCell(function(cell) {
					if (left) {
						cell.setAttribute("data-margin-left", value);
					} else {
						cell.setAttribute("data-margin-right", value);
					}
				});
			}
			this.setAlign = function(value) {
				if (value != "l" && value != "r" && value != "c") {
					value = "l";
				}
				$id("info_align_left")
					.classList.remove("active");
				$id("info_align_center")
					.classList.remove("active");
				$id("info_align_right")
					.classList.remove("active");
				this.forEachSelectedCell(function(cell) {
					cell.setAttribute("data-align", value);
				});
				$id({
						"l": "info_align_left",
						"c": "info_align_center",
						"r": "info_align_right"
					}[value])
					.classList.add("active");
			}

			this.updateLaTeXInfoCell = function(cell) {
				cell = cell || this.selectedCell;
				if (cell) {
					document.querySelector("#latex_content")
						.value = this.generateForCell(cell);
				}
			}
this.getHTML = (function(){
	var newline = false,
	_eqHTML = function(node, cont){
		if(node.nodeType == 3){
			cont.appendChild(node.cloneNode(true));
			if(!newline && /\S/.test(node.nodeValue)){
				newline = true;
			}
		}
		else if(node.nodeType == 1){
			var tagName = node.tagName, newnode;
			if(tagName == "B" || tagName == "I"){
				newnode = document.createElement(tagName);
				cont.appendChild(newnode);
			}
			else if(tagName == "STRONG"){
				newnode = document.createElement("B");
				cont.appendChild(newnode);
			}
			else if(tagName == "EM"){
				newnode = document.createElement("I");
				cont.appendChild(newnode);
			}
			else if(tagName.charAt(0) == "H" && /^\d$/.test(tagName.charAt(1))){
				// H1, H2, H3, H4, H5, H6
				if(newline){
					cont.appendChild(document.createElement("BR"));
				}
				newnode = document.createElement("B");
				cont.appendChild(newnode);
				cont.appendChild(document.createElement("BR"));
				newline = false;
			}
			else if(newline && (tagName == "DIV" || tagName == "P" || tagName == "HEADER" || tagName == "SECTION" || tagName == "FOOTER")){
				cont.appendChild(document.createElement("BR"));
				newline = false;
			}
			else if(tagName == "BR"){
				cont.appendChild(document.createElement("BR"));
				newline = false;
			}
			else if(node.className == "latex-equation"){
				newnode = document.createElement("span");
				newnode.className = "latex-equation";
				cont.appendChild(newnode);
				
			}
			else if(node.style.fontWeight == "bold" || node.style.fontWeight == "bolder" || (+node.style.fontWeight)>= 700){
				newnode = document.createElement("B");
				cont.appendChild(newnode);
			}
			else if(node.style.fontStyle == "italic" || node.style.fontStyle == "oblique"){
				newnode = document.createElement("I");
				cont.appendChild(newnode);
			}
			for(var i=0;i<node.childNodes.length;i++){
				_eqHTML(node.childNodes[i], newnode || cont)
			}
		}
	}
	return function(cell, n){
		var div;
		if(!n){
			div = cell.querySelector("div[contenteditable]");
		}
		else{
			div = cell.querySelectorAll("div[contenteditable]")[n]
		}
		if(div.innerHTML.indexOf("<") == -1){
			// Shortcut for text-only cells (most cells)
			return div.innerHTML;
		}
		if(div.innerText === "" && div.childNodes.length === 1 && div.firstChild.tagName == "BR"){
			// Fix this : https://connect.microsoft.com/IE/feedback/details/802442/ie11-rtm-implicit-br-tags-in-innerhtml-on-empty-content-editable-elements
			return "";
		}
		var cont = document.createElement("div");
		newline = false;
		for(var i=0;i<div.childNodes.length;i++){
			_eqHTML(div.childNodes[i], cont)
		}
		return cont.innerHTML;
	}
})();
			this.setHTML = function(cell, HTML) {
				cell.querySelector("div[contenteditable]")
					.innerHTML = HTML;
			}
			this.cellBefore = function(cell) {
				return cell.previousSibling;
			}
			this.blacklistPackages = {};
			this.isSelected = function(cell) {
				return cell.hasAttribute("data-selected");
			}
			this.lastSelectedCell = false;
			this.selectCell = function(element, CTRL, SHIFT) {
				if ((!CTRL && !SHIFT) || !this.lastSelectedCell) {
					this.removeAllSelection();
					this.showInfo(element);
					this.lastSelectedCell = this.selectedCell = element;
					element.setAttribute("data-selected", "data-selected");
				}
				else if (SHIFT) { //TODO
					var rows = this.element.rows, cells, startSelection = false;
					for(var i=0;i<rows.length;i++){
						cells = rows[i].cells;
						for(var j=0, cell;j<cells.length;j++){
							cell = cells[j];
							if(startSelection){
								if(cell === element || cell === this.lastSelectedCell){
									this.lastSelectedCell = element;
									// Hard break
									j = cells.length;
									i = rows.length;
								}
								cell.setAttribute("data-selected", "data-selected");
							}
							else if(cell === element || cell === this.lastSelectedCell){
								startSelection = true;
								element.setAttribute("data-selected", "data-selected");
							}
						}
					}
				} else {
					if (CTRL && element.hasAttribute("data-selected")) {
						element.removeAttribute("data-selected");
					} else {
						element.setAttribute("data-selected", "data-selected");
						this.lastSelectedCell = element
					}
				}
			}
			this._id = function(id) {
				return document.getElementById(id)
			}
			this.showInfo = function(element) {
				document.querySelector("#latex_content")
					.value = this.generateForCell(element);

				$id("info_diag_zero")
					.classList.remove("active");
				$id("info_diag_one")
					.classList.remove("active");
				$id("info_diag_two")
					.classList.remove("active");
				if (element.hasAttribute("data-two-diagonals")) {
					$id("info_diag_two")
						.classList.add("active");
				} else if (element.hasAttribute("data-diagonal")) {
					$id("info_diag_one")
						.classList.add("active");
				} else {
					$id("info_diag_zero")
						.classList.add("active");
				}
				this._id("info_align_left")
					.classList.remove("active");
				this._id("info_align_center")
					.classList.remove("active");
				this._id("info_align_right")
					.classList.remove("active");
				var align = element.getAttribute("data-align");
				if (align == "c") {
					this._id("info_align_center")
						.classList.add("active");
				} else if (align == "r") {
					this._id("info_align_right")
						.classList.add("active");
				} else {
					this._id("info_align_left")
						.classList.add("active");
				}
				if(element.hasAttribute("data-rotated")){
					this._id("info-rotated")
					.classList.add("active");
					this._id("info-unrotated").classList.remove("active")
				}
				else{
					this._id("info-unrotated").classList.add("active");
					this._id("info-rotated").classList.remove("active")
				}
			}
			this.applyToCell = function(td) {

				var div1 = document.createElement("div");
				div1.className = "outer";
				var div2 = document.createElement("div");
				div2.contentEditable = true;
				div2.innerHTML = "";
				div1.appendChild(div2);
				td.appendChild(div1);
				td.addEventListener("click", this._clickCellManager, false);
				return td;
			}
			this.split = function() {
				this.Table.split(document.querySelector("#table td[data-selected]"), this.applyToCell);
			}
			this.createCell = function(classNames) {
				var td = document.createElement("td");
				td.classNames = classNames || "";
				return this.applyToCell(td);
			}
			this.createRow = function(cols, classNames) {
				var tr = document.createElement("tr");
				for (var i = 0; i < cols; i++) {
					tr.appendChild(this.createCell(classNames));
				}
				return tr;
			}
			this.undo = function() {
				// A better undo manager is on the way;
				if (document.queryCommandEnabled("undo")) {
					document.execCommand("undo");
				}
			}
			this.selectionAllowed = true;
			this.hasShownBorderEditorInfo = false;
			this.mode = function(n) {
				if (arguments.length == 0) {
					if (document.body.hasAttribute("data-view-editor")) {
						return 1
					}
					if (document.body.hasAttribute("data-border-editor")) {
						return 2
					}
					return 0;
				} else {
					$id("button-mode-edit")
						.classList.remove("active");
					$id("button-mode-border")
						.classList.remove("active");
					$id("button-mode-view")
						.classList.remove("active");
					// Set
					if (n == 1 || n == 2) {
						var l = this.element.querySelectorAll("div[contenteditable]");
						for (var i = 0; i < l.length; i++) {
							(l[i] || {})
							.contentEditable = false;
						}
						this.selectionAllowed = false;
						if (n == 1) {
							// View
							document.body.removeAttribute("data-border-editor")
							document.body.setAttribute("data-view-editor", "data-view-editor");
							$id("button-mode-view")
								.classList.add("active");
						} else {
							// Border
							if (!this.hasShownBorderEditorInfo) {
								this.hasShownBorderEditorInfo = true;
								$("#border-editor-info")
									.show(100);
							}
							$("#right_border").collapse('show')
							document.body.removeAttribute("data-view-editor");
							document.body.setAttribute("data-border-editor", "data-border-editor");
							$id("button-mode-border")
								.classList.add("active");
						}
					} else {
						// Edit
						document.body.removeAttribute("data-view-editor")
						document.body.removeAttribute("data-border-editor")
						this.selectionAllowed = true;
						var l = this.element.querySelectorAll("div[contenteditable]");
						for (var i = 0; i < l.length; i++) {
							(l[i] || {})
							.contentEditable = true
						}
						$id("button-mode-edit")
							.classList.add("active");
					}
				}
			}
			this.log = "";
			this.message = function(text, type) {
				this.log += text + "\n---------------\n";
			}
			this.importFromJSON = function(o) {
				if (o.autoBooktabs) {
					document.body.setAttribute("data-booktabs", "data-booktabs");
					$id("button-booktabs")
						.classList.add("active");
				} else {
					document.body.removeAttribute("data-booktabs");
					$id("button-booktabs")
						.classList.remove("active");
				}
				if (o.caption) {
					if (o.caption.numbered) {
						$id("caption-nb")
							.value = "*";
					}
					$id("caption")
						.value = o.caption.caption || "";
					$id("label")
						.value = o.caption.label || "";
				}
				var table = document.createDocumentFragment();
				for (var i = 0; i < o.cells.length; i++) {
					var row = o.cells[i],
						elem = document.createElement("tr");
					for (var j = 0; j < row.length; j++) {
						var cellO = row[j];
						var cell = document.createElement("td");
						cell = this.applyToCell(cell);
						if (cellO.dataset.diagonal) {
							cell.querySelector(".outer")
								.innerHTML += "<div contenteditable>" + cellO.html[1] +
								"</div>";
							this.setHTML(cell, cellO.html[0]);
						} else {
							this.setHTML(cell, cellO.html);
						}
						for (var k in cellO.dataset) {
							if (cellO.dataset.hasOwnProperty(k)) {
								cell.dataset[k] = cellO.dataset[k];
							}
						}
						if ("rowSpan" in cellO && cellO.rowSpan > 1) {
							cell.rowSpan = cellO.rowSpan;
						}
						if (cellO.colSpan && cellO.colSpan > 1) {
							cell.colSpan = cellO.colSpan;
						}
						if (cellO.css) {
							cell.style.cssText = cellO.css;
						}
						elem.appendChild(cell);
					}
					table.appendChild(elem);
				}
				while (this.element.firstChild) {
					this.element.removeChild(this.element.firstChild);
				}
				this.element.appendChild(table);
			}
			this.exportToJSON = function() {
				var o = {},
					table = this.element;
				o.autoBooktabs = table.hasAttribute("data-booktabs");
				o.caption = this.caption();
				o.cells = []
				for (var i = 0; i < table.rows.length; i++) {
					var cells = table.rows[i].cells;
					o.cells.push([]);
					for (var j = 0; j < cells.length; j++) {
						var cell = cells[j],
							cellO = {};
						cellO.dataset = cell.dataset;
						if (cell.dataset.diagonal) {
							cellO.html = [this.getHTML(cell), this.getHTML(cell, 1)]
						} else {
							cellO.html = this.getHTML(cell);
						}
						if (cellO.dataset.selected) {
							delete cellO.dataset.selected;
						}
						cellO.css = cell.style.cssText;
						cellO.rowSpan = cell.rowSpan;
						cellO.colSpan = cell.colSpan;
						o.cells[o.cells.length - 1].push(cellO);
					}
				}
				o.version = this.version;
				return o;
			}
			this.importCSV = function(text){
				function createObject(str){
					var o = {}, div = document.createElement("div");
					div.innerText = div.textContent = str;
					o.html = div.innerHTML.replace(/\n/g, "<br>");
					return o;
				}

				text = text.replace(/^[\n\r]+/, "").replace(/[\n\r]+$/, "") + "\n";
				var table = [],
				row = [],
				indbl = false,
				start = true,
				content = "";
				for(var i=0, c;i<text.length;i++){
					c = text.charAt(i);
					if(start){
						start = false;
						if(c == '"'){
							indbl = true;
						}
						else{
							content += c;
						}
					}
					else if(c == '"' && indbl){
						if(text.charAt(i+1) == '"'){
							i++;
							content += c;
						}
						else{
							indbl = false;
						}
					}
					else if(c == "," && !indbl){
						row.push(createObject(content));
						indbl = false;
						content = "";
						start = true
					}
					else if(c == "\n" && !indbl){
						row.push(createObject(content));
						indbl = false;
						content = "";
						start = true
						table.push(row);
						row = [];
					}
					else{
						content += c;
					}
				}
				return {
					autoBooktabs : false,
					caption: {
       						caption: "",
        					numbered: false,
       			 			label: ""
    					},
					cells: table
				}
			};
			this.insertEquation = function() {
				if (window.getSelection) {
					var sel = window.getSelection();
					if (sel.rangeCount) {
						var range = sel.getRangeAt(0);
						if (range) {
							var eq = document.createElement("span");
							eq.className = "latex-equation";
							eq.appendChild(range.extractContents())
							range.insertNode(eq);
							range.selectNodeContents(eq);
						}
					}
				}
			}
			this.saveToJSON = function() {
				var o = this.exportToJSON();
				document.getElementById('c')
					.value = JSON.stringify(o, null, "    ");
			}
			this.autoBooktabs = function() {
				var table = this.element;
				if (table.hasAttribute("data-booktabs")) {
					table.removeAttribute("data-booktabs");
					$id('button-booktabs')
						.className = "btn btn-default";
				} else {
					table.setAttribute("data-booktabs", "data-booktabs");
					$id('button-booktabs')
						.className = "btn btn-default active";
				}
			}
			this._clickCellManager = function(event) {
				if (table.selectionAllowed) {
					table.selectCell(this, event.ctrlKey, event.shiftKey);
				}
			}
			this.isBorderSet = function(element, where){
				return element.getAttribute("data-border-" + where.toLowerCase()) == document.getElementById('border').value
			}
			this.setBorder = function(element, where, affect){
				where = where.toLowerCase();
				var where2 = where.charAt(0).toUpperCase() + where.substring(1),
				border = this.borderStyle();
				if(affect){
					element.setAttribute("data-border-" + where, border.name);
					element.style["border" + where2] = border.css;
				}
				else if(element.style.removeProperty){
					element.removeAttribute("data-border-" + where);
					element.style.removeProperty("border-" + where);
				}
				else{
					element.removeAttribute("data-border-" + where);
					element.style["border" + where2] = "";
				}
			}
			this.borderStyle = function(style){
				style = (style || document.getElementById('border').value).toLowerCase();
				var css = "1px solid black";
				if(style == "toprule" || style == "bottomrule"){
					css = "2px solid black";
				}
				else if(style == "double"){
					css = "2px double black";
				}
				else if(style == "hdashline"){
					css = "1px dashed black";
				}
				else if(style == "dottedline"){
					css = "1px dotted black";
				}
				
				return {
					name : style,
					css : css,
					color : "000000"
				}
			}
			this.setAllBorders = function() {
				var borderType = document.getElementById('border')
					.value,
					border = "1px solid black";
				if (borderType == "toprule" || borderType == "bottomrule") {
					border = "2px solid black";
				} else if (borderType == "double") {
					border = "2px double black";
				} else if (borderType == "hdashline") {
					border = "1px dashed black";
				} else if (borderType == "dottedline") {
					border = "1px dotted black";
				}
				this.forEachSelectedCell(function(cell) {
					var style = cell.style;
					style.borderTop = style.borderLeft = style.borderRight = style.borderBottom = border;
					cell.setAttribute("data-border-top", borderType);
					cell.setAttribute("data-border-left", borderType);
					cell.setAttribute("data-border-right", borderType);
					cell.setAttribute("data-border-bottom", borderType);
				});
			}
			this.removeBorders = function() {
				this.forEachSelectedCell(function(cell) {
					var style = cell.style;
					style.borderTop = style.borderLeft = style.borderRight = style.borderBottom = "";
					cell.removeAttribute("data-border-top");
					cell.removeAttribute("data-border-left");
					cell.removeAttribute("data-border-right");
					cell.removeAttribute("data-border-bottom");
				});
			}
			this._absolutePosition = function(el) {
				// Stolen from here : https://stackoverflow.com/a/32623832/8022172
				var found,
					left = 0,
					top = 0,
					width = 0,
					height = 0,
					offsetBase = this._absolutePosition.offsetBase;
				if (!offsetBase && document.body) {
					offsetBase = this._absolutePosition.offsetBase = document.createElement('div');
					offsetBase.style.cssText = 'position:absolute;left:0;top:0';
					document.body.appendChild(offsetBase);
				}
				if (el && el.ownerDocument === document && 'getBoundingClientRect' in el && offsetBase) {
					var boundingRect = el.getBoundingClientRect();
					var baseRect = offsetBase.getBoundingClientRect();
					found = true;
					left = boundingRect.left - baseRect.left;
					top = boundingRect.top - baseRect.top;
					width = boundingRect.right - boundingRect.left;
					height = boundingRect.bottom - boundingRect.top;
				}
				return {
					found: found,
					left: left,
					top: top,
					width: width,
					height: height,
					right: left + width,
					bottom: top + height
				};
			}
			this.defineBorder = function(element, where){	
				var borderType = document.getElementById('border').value,
					border = "1px solid black";
				if (borderType == "toprule" || borderType == "bottomrule") {
					border = "2px solid black";
				} else if (borderType == "double") {
					border = "2px double black";
				} else if (borderType == "hdashline") {
					border = "1px dashed black";
				} else if (borderType == "dottedline") {
					border = "1px dotted black";
				}
				where = where.toLowerCase();
				where = where.charAt(0).toUpperCase() + where.substring(1);
				this.setBorder(element, where, borderType, border, true)
			}
			this.editBorder = function(element, x, y) {
				var pos = this._absolutePosition(element),
					borderType = document.getElementById('border')
					.value,
					border = "1px solid black";
				if (borderType == "toprule" || borderType == "bottomrule") {
					border = "2px solid black";
				} else if (borderType == "double") {
					border = "2px double black";
				} else if (borderType == "hdashline") {
					border = "1px dashed black";
				} else if (borderType == "dottedline") {
					border = "1px dotted black";
				}
				if (y - pos.top < 4) {
					this.setBorder(element, "top", !this.isBorderSet(element, "top"));
				} else if (pos.bottom - y < 4) {
					this.setBorder(element, "bottom", !this.isBorderSet(element, "bottom"));
				} else if (x - pos.left < 4) {
					this.setBorder(element, "left", !this.isBorderSet(element, "left"));
				} else if (pos.right - x < 4) {
					this.setBorder(element, "right", !this.isBorderSet(element, "right"));
				}
			}
			this.loaded = false;
			this.element = null;
			this.load = function(table) {
				this.loaded = true;
				this.element = table;
				var _this = this;
				table.addEventListener("input", function(e) {
					var target = e.target || e.srcElement;
					target = target.nodeType == 3 ? target.parentElement : target;
					if (_this.selectedCell === (target.parentElement || {})
						.parentElement) {
						_this.updateLaTeXInfoCell();
					}
				}, false);
				table.addEventListener("click", function(e) {
					var target = e.currentTarget;
					if (target.tagName == "TD" || target.tagName == "TH") {
						_this._clickCellManager.apply(this, arguments);
					}
				}, false);



				document.execCommand("styleWithCSS", false, false);
				document.execCommand("insertBrOnReturn", false, false);
				this.Table = new Table(table);
			}
			this.generateFromHTML = function(html, ignoreMultiline) {
				var div = document.createElement("div"), hasMultiline;
				div.innerHTML = html;
				var el = div.querySelectorAll("span.latex-equation");
				var eq = []
				for (var i = 0; i < el.length; i++) {
					var kbd = document.createElement("kbd");
					eq.push("$" + (el[i].innerText || el[i].textContent) + "$");
					el[i].parentNode.replaceChild(kbd, el[i]);
				}
				html = div.innerHTML;
				var str = "", kbdcount = 0;
				for(var i=0,c;i<html.length;i++){
					c = html.charAt(i);
					if(c == "<"){
						var inside = html.substring(i, html.indexOf(">", i+1)+1),
						tagname = /^<?\s*\/?\s*([a-z]+)/i.exec(inside)[1].toLowerCase();
						if(/^<?\s*\//.test(inside)){tagname="/"+tagname;}
						if(tagname == "br"){
							hasMultiline = true;
							str += "\\\\";
						}
						else if(tagname == "kbd"){
							str += eq[kbdcount];
							kbdcount++;
						}
						else if(tagname == "b"){
							str += "\\textbf{";
						}
						else if(tagname == "i"){
							str += "\\textit{";
						}
						else if(tagname == "/b" || tagname == "/i"){
							str += "}";
						}
						else if(tagname != "/kbd"){
							str += inside;
						}
						i += inside.length-1;
					}
					else if(c == "&"){
						var inside = html.substring(i, html.indexOf(";", i+1)+1);
						if(inside == "&nbsp;"){
							str += "~";
						}
						else if(inside == "&amp;"){
							str += "\\&";
						}
						else if(inside == "&quot;"){
							str += '"';
						}
						i += inside.length-1;
					}
					else if(c == "\\"){
						str += "\\textbackslash{}";
					}
					else if(c == "$" || c == "%" || c == "^" || c == "_" || c == "{" || c == "}" || c == "|" || c == "#"){
						str += "\\" + c;
					}
					else if(c == "~"){
						str += "\\textasciitilde{}";
					}
					else{
						str+= c;
					}
				}
				str = str.replace(/[ ]{2,}/g, " ")
					.replace(/[\n\r]+/g, "");
				if (hasMultiline && !ignoreMultiline) {
					str = "\\begin{tabular}[c]{@{}l@{}}" + str + "\\end{tabular}";
				}
				return str
			};

			this.generateForCell = function(cell) {
				var text = "";
				if (cell.hasAttribute("data-two-diagonals")) {
					this.packages["diagbox"] = true;
					text = "\\diagbox{" + this.generateFromHTML(this.getHTML(cell, 2)) + "}{" + this.generateFromHTML(this.getHTML(cell)) + "}{" +
						this.generateFromHTML(this.getHTML(cell, 1)) + "}"
				} else if (cell.hasAttribute("data-diagonal")) {
					var ce = cell.querySelectorAll("div[contenteditable]");
					if (this.blacklistPackages["diagbox"]) {
						this.packages["slashbox"] = true;
					} else {
						this.packages["diagbox"] = true;
					}
					text = "\\backslashbox{" + this.generateFromHTML(this.getHTML(cell)) + "}{" + this.generateFromHTML(this.getHTML(cell, 1)) + "}";
				} else if (cell.hasAttribute("data-rotated")) {
					if (cell.rowSpan > 1) {
						if (this.blacklistPackages["makecell"]) {
							var inside = this.generateFromHTML(this.getHTML(cell), true)
							if (this.blacklistPackages["tabularx"]) {
								this.message("You may have to adjust the following value in one of your rotated cell : \"" + (cell.rowSpan - 0.2) + "\\normalbaselineskip\"");
								text = "\\begin{sideways}\\begin{tabular}{@{}p{" + (cell.rowSpan - 0.2) + "\\normalbaselineskip}@{}}" +
									inside + "\\end{tabular}\\end{sideways}";
								this.packages["rotating"] = true;
							} else {
								this.message("You may have to adjust the following value in one of your rotated cell : \"" + (cell.rowSpan) + "\\normalbaselineskip\"");
								text = "\\begin{sideways}\\begin{tabularx}{" + cell.rowSpan + "\\normalbaselineskip}{X}" + inside +
									"\\end{tabularx}\\end{sideways}";
								this.packages["rotating"] = this.packages["tabularx"] = true;
							}
						} else {
							text = "\\rotcell{" + this.generateFromHTML(this.getHTML(cell)) + "}"
							this.packages["makecell"] = true;
						}
					} else {
						if (this.blacklistPackages["rotating"]) {
							text = "\\rotcell{" + this.generateFromHTML(this.getHTML(cell)) + "}"
							this.packages["makecell"] = true;
						} else {
							text = "\\begin{sideways}" + this.generateFromHTML(this.getHTML(cell)) + "\\end{sideways}"
							this.packages["rotating"] = true;
						}
					}
				} else if (cell.rowSpan > 1 && !this.blacklistPackages["makecell"] && !this.blacklistPackages["multirow"]) {
					text = "\\makecell{" + this.generateFromHTML(this.getHTML(cell), true) + "}";
					this.packages["makecell"] = true;
				} else {
					text = this.generateFromHTML(this.getHTML(cell));
				}
				return text;
			}
			this.packages = {};
			this.getHeaderForCell = function(cell) {
				var align = cell.getAttribute("data-align") || "l",
					leftBorder = cell.getAttribute("data-border-left") || "",
					rightBorder = cell.getAttribute("data-border-right") || "",
					o = {
						"": "",
						"normal": "|",
						"double": "||",
						"toprule": "!{\\vrule width \\heavyrulewidth}",
						"midrule": "!{\\vrule width \\lightrulewidth}",
						"bottomrule": "!{\\vrule width \\heavyrulewidth}",
						"hdashline": ":",
						"dottedline": ";{1pt/1pt}"
					}
				leftBorder = o[leftBorder] || "";
				rightBorder = o[rightBorder] || "";
				return leftBorder + align + rightBorder
			}
			this.getSimiliHeaderForCell = function(cell) {
				var align = cell.getAttribute("data-align") || "l",
					leftBorder = cell.getAttribute("data-border-left") || "",
					rightBorder = cell.getAttribute("data-border-right") || "",
					o = {
						"": "",
						"normal": "|",
						"double": "=",
						"toprule": "^",
						"midrule": "#",
						"bottomrule": "_",
						"hdashline": ":",
						"dottedline": ";"
					}
				leftBorder = o[leftBorder] || "";
				rightBorder = o[rightBorder] || "";
				return leftBorder + align + rightBorder
			}
			this.convertToHeader = function(simili) {
				var _this = this;
				return simili.replace(/[|=\^\#_;:]+/g, function(a) {
					var c = a.charAt(0);
					if (c == ":" || c == ";") {
						_this.packages["arydshln"] = true;
					}
					return {
						"|": "|",
						"^": "!{\\vrule width \\heavyrulewidth}",
						"=": "||",
						"#": "!{\\vrule width \\heavyrulewidth}",
						"_": "!{\\vrule width \\lightrulewidth}",
						":": ":",
						";": ";{1pt/1pt}"
					}[c] || ""
				});
			}
			this.createCellObject = function(before, cell, after) {
				if (arguments.length == 2) {
					var content = before,
						o = {
							refCell: cell
						};
					if (content === false) {
						o.ignore = true;
					} else {
						o.content = o.fullContent = content;
					}
					return o;
				}
				var o = {
					cell: cell,
					ignore: false,
					before: before,
					after: after,
					leftBorder: cell.getAttribute("data-border-left") || "",
					rightBorder: cell.getAttribute("data-border-right") || "",
					content: this.generateForCell(cell),
					header: this.getHeaderForCell(cell),
					align: cell.getAttribute("data-align") || "l"
				}
				o.fullContent = before + "" + o.content + "" + after;
				return o;
			}
			this.createCellO = function(o, row){
				var before = row[o.x-1],
				    after = row[o.x+1],
				    cell = o.cell,
				    blockMultirow = this.blacklistPackages["multirow"];
				o.align = cell.getAttribute("data-align") || "l"
				o.content = this.generateForCell(cell);
				o.fullHeader = this.convertToHeader(this.getContextualHeader(before, o, after));
				o.header = this.convertToHeader(this.getComparableHeader(before, o, after));
				o.span = (cell.rowSpan != 1 || cell.colSpan != 1);
				o.static = false;
				o.rowSpan = cell.rowSpan;
				o.colSpan = cell.colSpan;
				o.leftBorder = cell.getAttribute("data-border-left") || "";
				if(!o.leftBorder && before){
					o.leftBorder = (before.refCell||before).cell.getAttribute("data-border-right") || ""
				}
				o.rightBorder = cell.getAttribute("data-border-right") || "";
				if(!o.rightBorder && after){
					o.rightBorder = (after.refCell||after).cell.getAttribute("data-border-left") || ""
				}
				o.fullContent = o.content;
				if(o.span){
					if(cell.rowSpan != 1){
						this.packages["multirow"] = true;
						if(cell.colSpan != 1){
							if(blockMultirow){
								o.fullContent = this.multicolumn(cell.colSpan, o.header, o.content);
							}
							else{
								o.fullContent = this.multicolumn(cell.colSpan, o.header, 
												this.multirow(cell.rowSpan, o.content)
												);
								o.static = true;
							}
						}
						else{
							if(blockMultirow){
								o.fullContent = o.content;
							}
							else{
								o.fullContent = this.multirow(cell.rowSpan, o.content);
							}
						}
					}
					else{
							o.fullContent = this.multicolumn(cell.colSpan, o.header, o.content);
							o.static = true;
					}
				}
			}
			this.multicolumn = function(span, header, content){
				return "\\multicolumn{"+span+"}{" + header + "}{" + content + "}";
			}
			this.multirow = function(span, content){
				return "\\multirow{"+span+"}{*}{"+content+"}";
			}
			this.matrix = function(){
				var table = this.element,
				    result = this.Table.matrix();
				for(var i=0;i<result.length;i++){
					var row = result[i];
					for(var j=0;j<row.length;j++){
						var cell = row[j];
						if(!cell.refCell){
							this.createCellO(cell, row);
						}
						else if(cell.refCell.x == cell.x){
							// ROWSPAN
							var refCell = cell.refCell;
							cell.ignore = false;
							cell.header = refCell.header;
							cell.fullHeader = refCell.fullHeader;
							if(refCell.cell.colSpan != 1){
								cell.fullContent = "\\multicolumn{" + refCell.colSpan + "}{" + refCell.header + "}{}";
								cell.static = true;
							}
							else{
								cell.fullContent = "";
								cell.static = false;
							}
						}
						else{
							// COLSPAN
							cell.ignore = true;
						}
					}
				}
				return result;
			}
			this.buildBlacklist = function() {
				var o = {},
					check = document.querySelectorAll("input[type=checkbox][id^=blacklist]");
				for (var i = 0; i < check.length; i++) {
					if (!check[i].checked) {
						o[check[i].value] = true;
					}
				}
				this.blacklistPackages = o;
				return o;
			}
			this.removeRow = function() {
				if (this.selectedCell) {
					this.Table.removeRow(this.selectedCell.parentElement.rowIndex);
				}
			}
			this.removeCol = function() {
				if (this.selectedCell) {
					this.Table.removeCol(this.Table.position(this.selectedCell)
						.x);
				}
			}
			this.getContextualHeader = function(before, middle, after) {
				if (before) {
					before = before.cell || before.refCell.cell;
				}
				if (after) {
					after = after.cell || after.refCell.cell;
				}
				var align = middle.align,
					leftBorder = "",
					rightBorder = "",
					o = {
						"": "",
						"normal": "|",
						"double": "=",
						"toprule": "^",
						"midrule": "#",
						"bottomrule": "_",
						"hdashline": ":",
						"dottedline": ";"
					};
				middle = middle.cell || middle.refCell.cell;
				if (before) {
					leftBorder = before.getAttribute("data-border-right");
				}
				leftBorder = o[leftBorder || (middle.getAttribute("data-border-left") || "")] || "";
				rightBorder = middle.getAttribute("data-border-right");
				if (after && !rightBorder) {
					rightBorder = after.getAttribute("data-border-left");
				}
				rightBorder = o[rightBorder || ""] || "";
				return leftBorder + align + rightBorder;
			}
			this.caption = function() {
				return {
					caption: $id("caption")
						.value,
					numbered: $id("caption-nb")
						.value == "*",
					label: $id("label")
						.value
				}
			}

			this.getComparableHeader = function(before, middle, after) {
				if (before) {
					before = before.cell || before.refCell.cell;
				}
				if (after) {
					after = after.cell || after.refCell.cell;
				}
				var align = middle.align,
					leftBorder = "",
					rightBorder = "",
					o = {
						"": "",
						"normal": "|",
						"double": "=",
						"toprule": "^",
						"midrule": "#",
						"bottomrule": "_",
						"hdashline": ":",
						"dottedline": ";"
					};
				middle = middle.cell || middle.refCell.cell;
				if (before) {
					leftBorder = "";
				} else {
					leftBorder = middle.getAttribute("data-border-left");
				}
				leftBorder = o[leftBorder || ""] || "";
				rightBorder = middle.getAttribute("data-border-right");
				if (after && !rightBorder) {
					rightBorder = after.getAttribute("data-border-left");
				}
				rightBorder = o[rightBorder || ""] || "";
				return leftBorder + align + rightBorder;
			}
			this.generate = function() {
				var start = +new Date()
				this.buildBlacklist();
				var format = $id("format")
					.value;
				this.log = "";
				if (format == "latex") {
					$id("c")
						.value = this.generateLaTeX();
				} else {
					this.interpret(format);
				}
				this.message("Generated in " + ((+new Date()) - start) + "ms");
				$id("log")
					.value = "Log (" + ((new Date())
						.toLocaleTimeString()) + ")\n=========\n" + this.log;
			}
			this.headers = function(matrix){
				matrix = matrix || this.matrix();
				var headers = [], colHeaders = [];
				for(var i=0;i<matrix.length;i++){
					var row = matrix[i];
					for(var j=0;j<row.length;j++){
						var cell = row[j];
						if(cell && !cell.ignore){
							var align = (cell.refCell||cell).header;
							if (!headers[j]) {
								headers[j] = {}
							}
							var headernow = headers[j];
							if(!headernow[align]){
								headernow[align] = 0;
							}
							headernow[align]++;
						}
					}
				}
				for (var i = 0; i < headers.length; i++) {
					var max = 0,
						value = "",
						headernow = headers[i];
					for (var j in headernow) {
						if (headernow.hasOwnProperty(j) && headernow[j] > max) {
							max = headernow[j];
							value = j;
						}
					}
					colHeaders.push(value);
				}
				return colHeaders;
			}
			this.generateLaTeX = function(opt) {
				this.packages = {}
				var table = this.element,
					caption = this.caption(),
					booktabs = table.hasAttribute("data-booktabs"),
					rg = this.matrix(),
					border;
				// Determine header
				var colHeaders = this.headers(),
				borderNewLine = $id("opt-latex-border").checked
				header = colHeaders.join("");
				var str = "\\begin{table}[]\n";
				if(this._id("table-opt-center").checked){
					str += "\\centering\n"
				}
				if (caption.caption) {
					str += "\\caption" + (caption.numbered ? "*" : "") + "{" + caption.caption + "}\n";
				}
				if (!caption.numbered && caption.label) {
					str += "\\label{" + caption.label + "}\n";
				}
				str += "\\begin{tabular}{" + header + "}";
				var rg2 = [];
				for(var i=0;i<rg.length;i++){
					var cells = rg[i];
					var row = []
					for(var j=0;j<cells.length;j++){
						var cell = cells[j],
						header = colHeaders[j] || "l";
						if(!cell || cell.ignore){
							row.push(false);
						}
						else if(!cell.static && cell.header != header){
							row.push({
								 	text:this.multicolumn(1, cell.header, cell.fullContent),
								 	colSpan : cell.colSpan
								 })
						}
						else{
							row.push({
									text:cell.fullContent, 
									colSpan : cell.colSpan || (cell.refCell ? cell.refCell.colSpan : 1) || 1
								 })
						}
					}
					rg2.push(row);
				}
				var beautifyRows = this.beautifyRows(rg2);
				for(var i=0;i<beautifyRows.length;i++){
					var row = beautifyRows[i];
					if (i === 0 && booktabs) {
						if(borderNewLine){
							border = " \n\\toprule";
						}
						else{
							border = " \\toprule";
						}
					} else {
						border = this.getBorder(i, rg);
						if(borderNewLine){
							border = border ? " \n" + border : ""
						}
						else{
							border = border ? " " + border : "";
						}
					}
					if (i !== 0) {
						str += " \\\\" + border
					} else {
						str += border;
					}
					str += "\n" + row;
				}
				if (booktabs) {
					str += "\\\\"+ (borderNewLine ? "\n" : " ") +"\\bottomrule"
				} else {
					border = this.getBorder(rg.length, rg);
					if (border) {
						str += "\\\\"+ (borderNewLine ? "\n" : " ") + border;
					}
				}
				str += "\n\\end{tabular}\n\\end{table}";
				// Booktabs
				if (/\\(bottomrule)|(toprule)|(midrule)|(cmidrule)|(heavyrulewidth)|(lightrulewidth)/.test(str)) {
					this.packages["booktabs"] = true;
				}
				// arydshln
				if (/\\(cdashline|hdashline)/.test(str)) {
					this.packages["arydshln"] = true;
				}
				// Packages
				var packages = "";
				for (var i in this.packages) {
					if (this.packages.hasOwnProperty(i) && i != "arydshln") {
						packages += "% \\usepackage{" + i + "}\n";
					}
				}
				if (this.packages["arydshln"]) {
					// Compatibility between packages
					packages += "% \\usepackage{arydshln}\n";
				}
				/* Show some message*/
				if (this.element.querySelector("td[data-two-diagonals]")) {
					this.message(
						"If you get an '! FP error: Logarithm of negative value!.' error, the content of the bottom part of one of your cells with two diagonals is too long."
					)
				}
				return (packages ? packages + "\n\n" : "") + str;
			}
			this.beautifyRows = function(rows){
console.dir(rows);debugger;
				var rows2 = [], n = 0, start = [], max = [];
				if($id("opt-latex-whitespace").checked){
					for(var i=0;i<rows.length;i++){
						rows2[i] = "";
						var cells = rows[i];
						for(var j=0;j<cells.length;j++){
							var cell = cells[j];
							if(cell){
								if(j!==0){
									rows2[i] += " & ";
								}
								rows2[i] += cell.text;
							}
						}
					}
					return rows2;
				}
				for(var i=0;i<rows.length;i++){
					rows2.push("");
					start.push(0);
					max.push(0);
					n = Math.max(n, rows[i].length);
				}
				for(var i=0;i<n;i++){
					var unspace = false;
					for(var j=0;j<rows.length;j++){
						var cell = rows[j][i];
						if(start[j] != i){continue}
						if(i !== 0){
							var submax = max[i-1];
							for(var k=rows2[j].length;k<submax+1;k++){
								rows2[j]+= " ";
							}
							rows2[j] += "& ";
						}
						rows2[j]+= cell.text;
						max[i] = Math.max(max[i], rows2[j].length);
						start[j]+= cell.colSpan;
					}
				}
				max = 0;
				for(var i=0;i<rows2.length;i++){
					max = Math.max(max, rows2[i].length);
				}
				for(var i=0;i<rows2.length;i++){
					for(var j=rows2[i].length;j<max+1;j++){
						rows2[i]+= " ";
					}
				}
				return rows2;
			}
			this.extract = (function() {
				function borderInfo(cell, o) {
					var style = cell.style,
						css = "",
						types = {
							"solid": ["normal", "1px solid black"],
							"double": ["double", "2px solid black"],
							"dashed": ["hdashline", "1px dashed black"],
							"dotted": ["dottedline", "1px dotted black"]
						},
						first = "";
					["Left", "Right", "Bottom", "Top"].forEach(function(val) {
						var type = style["border" + val + "Style"];
						if (type && type != "none") {
							var valLC = val.toLowerCase(),
								res = types[type] || ["normal", "1px solid black"];
							o.dataset["border" + val] = res[0];
							css += "border-" + valLC + ":" + res[1] + ";";
							if (!first) {
								first = res[1];
							}
						}
					});
					if (first && first == style.border) {
						return "border: " + first + ";";
					}

					return css;
				}

				function getHTML(html) {
					html = html.replace(/<\s*\/?\s*([^>]+)>/gi, function(a, b) {
						if (!/^((em)|i)($|[^a-z])/i.test(b)) {
							return "";
						}
						return a;
					});
					var div = document.createElement("div");
					div.innerHTML = html;
					return div.innerHTML;
				}
				return function(div) {
					var table = div.querySelector("table");
					if (!table) {
						return;
					}
					var o = {
						autoBooktabs: false,
						cells: []
					}
					// Caption
					var wordCaption = div.querySelector(".MsoCaption") || table.caption;
					o.caption = {
						caption: wordCaption ? (wordCaption.innerText || wordCaption.textContent) : table.title || "",
						numbered: false,
						label: table.id || ""
					}
					for (var i = 0; i < table.rows.length; i++) {
						var cells = table.rows[i].cells;
						o.cells[i] = [];

						for (var j = 0; j < cells.length; j++) {
							var cell = cells[j],
								o2 = {
									dataset: {}
								};
							if ((cell.getAttribute("style") || cell.style.cssText)
								.indexOf("mso-diagonal") > -1) {
								o2.dataset.diagonal = "data-diagonal";
								o2.html = [getHTML(cell.innerHTML), ""]
							} else {
								o2.html = getHTML(cell.innerHTML);
							}
							o2.css = borderInfo(cell, o2);
							o2.rowSpan = cell.rowSpan;
							o2.colSpan = cell.colSpan;
							o.cells[i][j] = o2;
						}
					}
					this.importFromJSON(o);
				}
			})()
			this.hBorder = function(n, callback, matrix) {
				var row = matrix[Math.max(0, (n || 0) - 1)];
				if (!row) {
					return callback.call(this)
				}
				var border = "",
					subBorder = {},
					always = true;
				if (n == 0) {
					for (var i = 0; i < row.length; i++) {
						if (row[i].refCell) {
							always = false;
							continue;
						}
						var cell = row[i].cell,
							bd = cell.getAttribute("data-border-top");
						if (bd) {
							if (!subBorder[bd]) {
								subBorder[bd] = []
							}
							for (var j = 0; j < cell.colSpan; j++) {
								subBorder[bd].push(i);
								i++;
							}
							i--;
							if (border == "") {
								border = bd;
							} else if (border != bd) {
								always = false;
							}
						} else {
							always = false;
						}
					}
				} else {
					var row2 = matrix[n] || [];
					for (var i = 0; i < row.length; i++) {
						var cell = row[i];
						cell = cell.cell || cell.refCell.cell;
						if (cell.parentElement.rowIndex + cell.rowSpan != n) {
							always = false;
							continue;
						}
						var bd = cell.getAttribute("data-border-bottom");
						if (!bd && row2[i]) {
							var cell = row2[i];
							if (cell.cell || (cell.refCell.cell.rowIndex == n + 1)) {
								bd = (cell.cell || cell.refCell.cell)
									.getAttribute("data-border-top");
							}
						}
						if (bd) {
							if (!subBorder[bd]) {
								subBorder[bd] = []
							}
							subBorder[bd].push(i);
							if (border == "") {
								border = bd;
							} else if (border != bd) {
								always = false;
							}
						} else {
							always = false;
						}
					}
				}
				return callback.call(this, always, border, subBorder);
			}
			this.prepareDownload = function() {
				var latex = this.generateLaTeX();
				latex = latex.replace(/^%\s*usePack/mg, "usePack");
				latex = "\\documentclass{article}\n" + latex;
				latex = latex.replace(/\\begin{tabl/, "\\begin{document}\n\\begin{tabl") + "\n\\end{document}";
				var link = "data:application/x-tex;base64," + btoa(latex);
				$id("link-download")
					.href = link;
				$('#download')
					.modal('show');
			}
			this.getBorder = function(n, matrix) {
				return this.hBorder(n, function(always, border, subBorder) {
					if (arguments.length == 0) {
						return ""
					}
					if (always) {
						return {
							normal: "\\hline",
							double: "\\hline\\hline",
							toprule: "\\toprule",
							midrule: "\\midrule",
							bottomrule: "\\bottomrule",
							hdashline: "\\hdashline",
							dottedline: "\\hdashline[1pt/1pt]"
						}[border];
					} else {
						border = ""
						var o = {
							normal: "\\cline",
							toprule: "\\cmidrule[\\heavyrulewidth]",
							midrule: "\\cmidrule",
							bottomrule: "\\cmidrule[\\heavyrulewidth]",
							hdashline: "\\cdashline",
							dottedline: "\\cdashline"
						}
						if (!subBorder["double"] || subBorder.toprule || subBorder.midrule || subBorder.bottomrule) {
							for (var i in subBorder) {
								if (subBorder.hasOwnProperty(i)) {
									var bd = subBorder[i],
										actu = -2,
										start = -2;
									for (var j = 0; j < bd.length + 1; j++) {
										var nb = (j < bd.length) ? bd[j] : -7;
										if (actu + 1 != nb) {
											if (start >= 0) {
												if (i == "double") {
													// Rare case
													var part = "\\cmidrule{" + (start + 1) + "-" + (actu + 1) + "}";
													border += part + "\\morecmidrule" + part;
												} else {
													border += o[i] + "{" + (start + 1) + "-" + (actu + 1) + "}";
													if (i == "dottedline") {
														border += "[1pt/1pt]";
													}
												}
											}
											start = nb;
										}
										actu = nb
									}
								}
							}
						} else {
							// Another rare case when there's Double subrules. We'll use hhline for this.
							// TODO
							var length = matrix[n].length;
							var arrBorder = [];
							var row = matrix[n-1] || matrix[n]
							for(var i in subBorder){
								if(subBorder.hasOwnProperty(i)){
									var sb = subBorder[i];
									for(var j=0;j<sb.length;j++){
										arrBorder[+sb[j]] = i;
									}
								}
							}
							this.packages["hhline"] = true;
							border = "\\hhline{";
							for(var i=0;i<length;i++){
								sb = arrBorder[i];
								if(i == 0){
									var borderLeft = (row[i].refCell||row[i]).leftBorder;
									if(borderLeft == "normal"){
										border += "|";
									}
									else if(borderLeft == "double"){
										border += "||";
									}
								}
								if(!sb){
									border += "~";
								}
								else if(sb == "double"){
									border+="="; 
								}
								else{
									border += "-";
								}
								var borderRight = (row[i].refCell||row[i]).rightBorder;
								if(borderRight == "normal"){
									border += "|";
								}
								else if(borderRight == "double"){
									border += "||";
								}
							}
							border += "}";
						}
					}
					return border;
				}, matrix);
			}
		})()
	window.table = table;
})();
window.addEventListener("beforeunload", function() {
	if (window.table) {
		localStorage.setItem("table", JSON.stringify(table.exportToJSON()));
		if ($id("format")) {
			localStorage.setItem("table_format", $id("format")
				.value);
		}
	}
}, false);
(function(){
	var initialX = 0,
	initialY = 0,element, start = false;
	function intersectRect(r1, r2) {
	  return !(r2.left > r1.right || 
	           r2.right < r1.left || 
	           r2.top > r1.bottom ||
	           r2.bottom < r1.top);
	   }
	function calculate(x, y){
		if(document.body.hasAttribute("data-border-editor")){
			element.style.top = initialY + "px";
			element.style.left = initialX + "px";
			element.style.width = Math.sqrt((initialY-y)*(initialY-y)+(initialX-x)*(initialX-x))+"px";
			var angle = Math.atan2(x- initialX,- (y- initialY) )*(180/Math.PI)-90;
			element.style.transform = "rotate(" + angle + "deg)";
		}
	}
	window.addEventListener("selectstart", function(e){
		if(start){
			e.preventDefault();
			return false;
		}
	});
	window.addEventListener("mousedown", function(e){
		if(!element){
			element = document.getElementById('line');
		}
		if(document.body.hasAttribute("data-border-editor") && element){
			element.style.display="block";
			initialX = e.pageX;
			initialY = e.pageY;
			calculate(initialX, initialY);
			start = true;
		}
	});
	window.addEventListener("mousemove", function(e){
		if(start){
			if(document.body.hasAttribute("data-border-editor") && element){
				calculate(e.pageX, e.pageY);
			}
			else{
				start = false;should = null;
			}
		}
	});
	window.addEventListener("mouseup", function(e){
		if(document.body.hasAttribute("data-border-editor") && element){
			var rectangle = {
						top : Math.min(initialY, e.pageY),
						bottom : Math.max(initialY, e.pageY),
						left : Math.min(initialX, e.pageX),
						right : Math.max(initialX, e.pageX)
					},
			tableElement = table.element;
			element.style.display="none";
			var should = null;
			if(Math.sqrt((rectangle.bottom-rectangle.top)*(rectangle.bottom-rectangle.top)+(rectangle.bottom-rectangle.top)
			   + (rectangle.right-rectangle.left)*(rectangle.right-rectangle.left))<8){
				for(var i=0;i<tableElement.rows.length;i++){
					var cells = tableElement.rows[i].cells;
					for(var j=0;j<cells.length;j++){
						var cell = cells[j],
						posCell = table._absolutePosition(cell);
						if(intersectRect(posCell, rectangle)){
							table.editBorder(cell, e.pageX, e.pageY)
							// Force exit
							j = cells.length;
							i = tableElement.rows.length;
							break;
						}
					}
				}
			}
			else if(Math.abs(initialY-e.pageY)<=10){
				var matrix = table.Table.matrix(),row;
				for(var i=0;i<matrix.length;i++){
					row = matrix[i];
					for(var j=0,cell,posCell;j<row.length;j++){
						cell = row[j];
						cell = (cell.refCell||cell).cell;
						posCell = table._absolutePosition(cell);
						if(intersectRect(posCell, rectangle)){
							var where = (rectangle.top+(rectangle.bottom-rectangle.top)/2 > posCell.top+posCell.height/2) 
								    ? "bottom" : "top";
							if(should === null){
								should = !table.isBorderSet(cell, where);
							}
							table.setBorder(cell, where, should)
						}
					}
				}
			}
			else if(Math.abs(initialX-e.pageX) <= 10){
				var matrix = table.Table.matrix(),row;
				for(var i=0;i<matrix.length;i++){
					row = matrix[i];
					for(var j=0,cell,posCell;j<row.length;j++){
						cell = row[j];
						cell = (cell.refCell||cell).cell;
						posCell = table._absolutePosition(cell);
						if(intersectRect(posCell, rectangle)){
							var where = (rectangle.left+(rectangle.right-rectangle.left)/2 > posCell.left+posCell.width/2)
								    ? "right" : "left";
							if(should === null){
								should = !table.isBorderSet(cell, where);
							}
							table.setBorder(cell, where, should)
						}
					}
				}
			}
			start = false;
			should = null;
			initialY = initialX = 0;
		}
	});
})();