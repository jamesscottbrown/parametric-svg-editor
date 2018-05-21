var parameters = {'x': 60, "y": 60, "d": 5};
var numericFields = ["cx", "cy", "r", "width", "height", "x1", "x2", "y1", "y2", "stroke-width"];

function importSVG(svgText) {

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



                    addItem(sublist, name, attribute, child)
                }
            }



            tag_item.append("button")
            //.attr("href", "")
            .text("Add attribute")
            .datum({child: child, sublist: sublist})
            .on("click", function(d){
                var name = prompt('Name');
                addItem(sublist, name, {nodeValue: ""}, d.child)
            })
        }
}

function addElement(){
    var type = prompt("Tag name");
    var child = d3.select("svg").append(type).node();
    addNodeToList(child);
}

function addItem(sublist, name, attribute, child) {

    if (name === "d"){

        sublist.append("li")
            .text("Path:")
            .datum({element: child, attribute_name: name}); // ?

        var segmentsList = sublist.append("ul");

        var segments = splitPath(attribute.nodeValue);

        segmentsList.selectAll("li")
            .data(segments)
            .enter()
            .append("li")
            .append("input")
            .property("value", function(d){ return d; })
            .on("change", function(){

                d3.select(this.parentNode).datum(this.value);

                var segmentString = "";
                for (var i in this.parentNode.parentNode.children){
                    var segment = d3.select(this.parentNode.parentNode.children[i]);
                    segmentString = segmentString + segment.data();
                }

                // set this as d attribute for the sublist
                attribute.nodeValue = segmentString;
            })


    } else {
        var subitem = sublist.append("li").text(name + ": ");

        subitem.append("input")
            .property("value", attribute.nodeValue)
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


function getParameters(attributes) {

    if (!attributes) {
        return;
    }

    for (var j = 0; j < attributes.length; j++) {
        var attribute = attributes[j];

        if (attribute.name.startsWith("parametric:")) {
            var expression = attribute.nodeValue
                .replace(/\$\{/g, '')
                .replace(/\}/g, '')
                .replace(/\+/g, ' ')
                .replace(/\-/g, ' ')
                .replace(/\^/g, ' ')
                .replace(/\//g, ' ')
                .replace(/\*/g, ' ');

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
    }

    updateParamsList();
}


function applyParameters() {
    var svg = d3.select("parametric-svg").select("svg").node();
    parametricSvg(svg, parameters);
}

function setup() {

    applyParameters();

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

}

function splitPath(pathString){
    var i = 0;
    var segments = [];

    for (var k=1; k<pathString.length; k++){
        if (pathString[k].match(/[a-z]/i)){
            segments.push(pathString.substring(i, k).trim());
            i = k;
        }
    }
    return segments;
}
