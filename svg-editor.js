var parameters = {'x': 60, "y": 60, "d": 5};
var numericFields = ["cx", "cy", "r", "width", "height", "x1", "x2", "y1", "y2", "stroke-width"];

function importSVG(svgText) {
    // Load an SVg or parametric SVG from a string

    // clear param list
    var codePanel = d3.select("#parameter-list");
    codePanel.node().innerHTML = "";
    codePanel.append("ul").attr("id", "paramList");

    // clear element list
    var elements = d3.select("#elements");
    elements.node().innerHTML = "";
    elements.append("ul").attr("id", "elementList");

    parameters = {};

    if (!svgText) {
        return;
    }

    var svg = document.querySelector('svg');
    svg.innerHTML = svgText;

    var children = svg.childNodes;
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        // TODO: need to igo deeper for <g>
        // child.id
        // child.classList
        // child.attributes

        addNodeToList(child)
    }

    elements.append("button")
        .text("Add Element")
        .on("click", addElement)

}

function addNodeToList(child){
        element_list = d3.select("#elementList");
        getParameters(child.attributes);

        if (child.tagName) {
            var tag_item = element_list.append("li").text(child.tagName);
            var sublist = tag_item.append("ul");


            if (child.attributes) {
                for (var j = 0; j < child.attributes.length; j++) {
                    var attribute = child.attributes[j];

                    var name = attribute.name;

                    // Don't display parameter if it a "parametric:" version of parameter also exists
                    if (child.attributes.getNamedItem("parametric:" + name)) {
                        continue;
                    }

                    // if name starts with "parametric:", remove that
                    if (name.startsWith("parametric:")) {
                        name = name.substr(11);
                    }

                    addItem(sublist, name, attribute.nodeValue, child)
                }
            }

            tag_item.append("button")
            .text("Add attribute")
            .datum({child: child, sublist: sublist})
            .on("click", function(d){
                var name = prompt('Name');
                addItem(sublist, name, "", d.child)
            })
        }
}

function addElement(){
    var type = prompt("Tag name");
    var child = d3.select("svg").append(type).node();
    addNodeToList(child);
}


function updatePath(input, child){
    d3.select(input.parentNode).datum(input.value);

    var children = Array.prototype.slice.call(input.parentNode.parentNode.children); // convert to array so can use map
    var segmentStrings = children.map( function(n){ return d3.select(n).data() });
    var segmentString = segmentStrings.join(" ");

    var segments = splitPath(segmentString);

    var isParameteric = false;
    for (var i=0; i<segments.length; i++){
        var stripped = segments[i].substr(1).replace(/ /g, '').replace(/,/g, '').replace(/'/g, '').replace(/-/g, '');

        if (this.value !== (+this.value).toString()){
            isParameteric = true;
            break;
        }
    }

    if (isParameteric){
        segmentStrings = segmentStrings.map(function(n){ return "'" + n + "'"});
        child.setAttribute("parametric:d", segmentStrings.join(" + "));
        getParameters(child.attributes);
        applyParameters();
    } else {
        child.removeAttribute('parametric:d');
        child.setAttribute('d', segmentString);
    }
}



function updateStyle(input, child){

    d3.select(input.parentNode).datum(input.value);

    var children = Array.prototype.slice.call(input.parentNode.parentNode.children); // convert to array so can use map
    var segmentStrings = children.map( function(n){ return d3.select(n).data() });
    var segmentString = segmentStrings.join("; ");

    var segments = segmentString.split(';');

    var isParameteric = false;
    for (var i=0; i<segments.length; i++){

        [field, val] = segments[i].split(":");

        if (val.indexOf("'") !== -1){
            isParameteric = true;
            break;
        }
    }

    if (isParameteric){
        segmentStrings = segmentStrings.map(function(n){ return "'" + n + ";'"});
        child.setAttribute("parametric:style", segmentStrings.join(" + "));

        // extract only what was in single quotes
        var paramString = val.split("'").filter( function(d,i){ return i%2 == 1 }).join(" ");

        getParameters([{name: "parametric:style", nodeValue: paramString}]);
        applyParameters();
    } else {
        child.removeAttribute('parametric:style');
        child.setAttribute('style', segmentString);
    }
}

function addItem(sublist, name, value, child) {

    if (name === "d"){

        sublist.append("li")
            .text("Path:")
            .datum({element: child, attribute_name: name}); // ?

        var segmentsList = sublist.append("ul");

        var segments = splitPath(value);

        segmentsList.selectAll("li")
            .data(segments)
            .enter()
            .append("li")
            .append("input")
            .property("value", function(d){ return d; })
            .on("change", function(){
                updatePath(this, child);
            });

        sublist.append("button")
            .text("+")
            .on("click", function(){

                segmentsList
                    .append("li")
                    //.datum([""])
                    .append("input")
                    .property("value", "")
                    .on("change", function(){
                         updatePath(this, child);
                    });
            })


    } else if (name === "style") {

        sublist.append("li")
            .text("Style:")
            .datum({element: child, attribute_name: name}); // ?

        var segmentsList = sublist.append("ul");

        var segments = value.split(';');

        segmentsList.selectAll("li")
            .data(segments)
            .enter()
            .append("li")
            .append("input")
            .property("value", function(d){ return d; })
            .on("change", function(){
                updateStyle(this, child);
            });

        sublist.append("button")
            .text("+")
            .on("click", function(){

                segmentsList
                    .append("li")
                    //.datum([""])
                    .append("input")
                    .property("value", "")
                    .on("change", function(){
                         updateStyle(this, child);
                    });
            })



    } else {
        var subitem = sublist.append("li").text(name + ": ");

        subitem.append("input")
            .property("value", value)
            .datum({element: child, attribute_name: name})
            .on("change", function (d) {

                if (this.value !== (+this.value).toString() && numericFields.indexOf(d.attribute_name) !== -1) {
                    // treat as a parametric expression
                    d.element.setAttribute("parametric:" + d.attribute_name, this.value);
                    getParameters(d.element.attributes);
                    applyParameters();
                } else {
                    d.element.removeAttribute('parametric:' + d.attribute_name);
                    d.element.setAttribute(d.attribute_name, this.value);
                }
            });

        subitem.append("button")
            .datum({element: child, attribute_name: name})
            .text("-")
            .on("click", function(d){

                d.element.removeAttribute('parametric:' + d.attribute_name);
                d.element.removeAttribute(d.attribute_name);

                subitem.node().innerHTML = "";
                subitem.remove();
            })
        }
}


function updateParamsList() {

    // add inputs for any newly-created parameters
    for (var p in parameters) {

        if (!d3.select("#parameter-" + p).empty()) {
            continue;
        }

        d3.select("#paramList")
            .append("li")
            .text(p + ": ")
            .datum(p)
            .append("input")
            .attr("id", "parameter-" + p)
            .property("value", parameters[p])
            .on("change", function (d) {
                parameters[d] = +this.value;
                applyParameters();
            });
    }


}



function processExpressionTerm(term) {
    var expression = term
        .replace(/\$\{/g, '')
        .replace(/\}/g, '')
        .replace(/\+/g, ' ')
        .replace(/\-/g, ' ')
        .replace(/\^/g, ' ')
        .replace(/\//g, ' ')
        .replace(/\*/g, ' ')
        .replace(/,/g, ' ')
        .replace(/'/g, ' ');

    var terms = expression.split(" ");

    for (var term in terms) {
        if (!terms[term] || !isNaN(terms[term])) {
            continue;
        }

        if (!parameters[terms[term]]) {
            parameters[terms[term]] = 0;
        }
    }

}


function getParameters(attributes) {
    // Given a NamedNodeMap or Array of attributes for a tag, identify any parameters not recorded in the parameters array

    if (!attributes) {
        return;
    }

    for (var j = 0; j < attributes.length; j++) {
        var attribute = attributes[j];

        if (attribute.name.startsWith("parametric:")) {

            if (attribute.name === "parametric:d"){

                var segments = splitPath(attribute.nodeValue);
                for (var i=0; i<segments.length; i++){
                    processExpressionTerm(segments[i].substr(1).trim()); // strip off initial character
                }

            } else {
                processExpressionTerm(attribute.nodeValue);
            }

        }
    }

    updateParamsList();
}


function applyParameters() {
    // Substitutes the values in parameters into the SVG
    var svg = d3.select("parametric-svg").select("svg").node();
    parametricSvg(svg, parameters);
}

function setup() {

    d3.select("#svg-panel")
        .append("button")
        .text("Copy SVG")
        .on("click", function () {
            prompt(
                'Press [CTRL + C], then [ENTER] to copy the SVG to your clipboard.',
                d3.select("svg").node().innerHTML
            )
        });


    d3.select("#svg-panel")
        .append("button")
        .text("Import SVG")
        .on("click", function () {
            importSVG(prompt("Paste contents to <svg> tag"))
        });


    d3.select("#parameters")
        .append("button")
        .text("Copy Parameter values")
        .on("click", function () {
            prompt(
                'Press [CTRL + C], then [ENTER] to copy the SVG to your clipboard.',
                JSON.stringify(parameters)
            )
        });

    importSVG('<circle parametric:cx="x + d" parametric:cy=y r="40" stroke="black" stroke-width="3" fill="blue" />\n' +
        '  <circle parametric:cx=x parametric:cy=y r="40" stroke="black" stroke-width="3" fill="green" />\n')

    applyParameters();
}

function splitPath(pathString){
    // Splits a SVG path d attribute into individual commands and return as an array

    var i = 0;
    var segments = [];

    for (var k=1; k<pathString.length; k++){
        if (pathString[k].match(/[mlhvcsqa]/i) && pathString[k+1] === " "){
            segments.push(pathString.substring(i, k).trim());
            i = k;
        }
    }

    if (i < k){
        segments.push(pathString.substring(i).trim());
    }

    return segments;
}
