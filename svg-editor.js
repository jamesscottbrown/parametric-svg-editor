let parametricSVG = {};

function importSVG(svgText) {
    // Load an SVG or parametric SVG from a string

    // clear param list
    const codePanel = d3.select("#parameter-list");
    codePanel.node().innerHTML = "";
    codePanel.append("ul").attr("id", "paramList");

    // clear element list
    const elements = d3.select("#elements");
    elements.node().innerHTML = "";
    elements.append("ul").attr("id", "elementList");

    let parameters = {};

    if (!svgText) {
        return;
    }

    let svgContainer = document.getElementById('svg-panel');
    parametricSVG = new ParametricSVG(svgContainer, svgText);

    // ?
    //svg = document.querySelector('svg'); // reference will be lost if outerHTML was changes


    let children = parametricSVG.svg.childNodes;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        // TODO: need to go deeper for <g>
        // child.id
        // child.classList
        // child.attributes

        addNodeToList(child);
        updateParamsList();
    }

    // Load default parameter values
    parameters = parametricSVG.getDefaultParamValues();
    for (let paramName in parameters){
        d3.select("#parameter-" + paramName)
            .property("value", parameters[paramName]);
    }

    elements.append("button")
        .text("Add Element")
        .on("click", addElement)
}

function addElement() {
    const type = prompt("Tag name");
    const child = d3.select("svg").append(type).node();
    addNodeToList(child);
    updateParamsList();
}


function updatePath(input, child) {
    d3.select(input.parentNode).datum(input.value);

    const children = Array.prototype.slice.call(input.parentNode.parentNode.children); // convert to array so can use map
    const segmentStrings = children.map(function (n) {
        return d3.select(n).data()
    });
    const segmentString = segmentStrings.join(" ");

    const segments = splitPath(segmentString);

    let isParameteric = false;
    for (let i = 0; i < segments.length; i++) {
        let stripped = segments[i].substr(1).replace(/ /g, '').replace(/,/g, '').replace(/'/g, '').replace(/-/g, '');

        if (this.value !== (+this.value).toString()) {
            isParameteric = true;
            break;
        }
    }

    if (isParameteric) {
        child.setAttribute("parametric:d", segmentString);
        parametricSVG.getParameters(child.attributes);
        parametricSVG.applyParameters();
    } else {
        child.removeAttribute('parametric:d');
        child.setAttribute('d', segmentString);
    }
}


function updateStyle(input, child) {

    d3.select(input.parentNode).datum(input.value);

    const children = Array.prototype.slice.call(input.parentNode.parentNode.children); // convert to array so can use map
    const segmentStrings = children.map(function (n) {
        return d3.select(n).data()
    });
    const segmentString = segmentStrings.join("; ");

    const segments = segmentString.split(';');

    let isParameteric = false;

    let field, val;
    for (let i = 0; i < segments.length; i++) {

        [field, val] = segments[i].split(":");

        if (!val) {
            val = "";
        }

        if (val.indexOf("{") !== -1) {
            isParameteric = true;
            break;
        }
    }

    if (isParameteric) {
        child.setAttribute("parametric:style", segmentString);

        parametricSVG.getParameters([{name: "parametric:style", nodeValue: val}]);
        parametricSVG.applyParameters();
    } else {
        child.removeAttribute('parametric:style');
        child.setAttribute('style', segmentString);
    }
}


function addItem(sublist, name, value, child) {
// Adds bullet point for an attribute


    if (name === "d") {

        sublist.append("li")
            .text("Path:")
            .datum({element: child, attribute_name: name}); // ?

        const segmentsList = sublist.append("ul");

        const segments = splitPath(value);

        const segmentItems = segmentsList.selectAll("li")
            .data(segments)
            .enter()
            .append("li");

        segmentItems.append("textarea")
            .property("value", function (d) {
                return d;
            })
            .on("change", function () {
                updatePath(this, child);
            });

        segmentItems.append("button")
            .text("-")
            .on("click", function () {
                this.value = " : ";
                updatePath(this, child);

                const parentNode = this.parentNode;
                parentNode.innerHTML = "";
                d3.select(parentNode).remove();
            });

        // Button to add path segment
        sublist.append("button")
            .text("+")
            .on("click", function () {

                segmentsList
                    .append("li")
                    //.datum([""])
                    .append("textarea")
                    .property("value", "")
                    .on("change", function () {
                        updatePath(this, child);
                    });
            });


    } else if (name === "style") {

        sublist.append("li")
            .text("Style:")
            .datum({element: child, attribute_name: name}); // ?

        const segmentsList = sublist.append("ul");

        const segments = value.split(';');

        const segmentItems = segmentsList.selectAll("li")
            .data(segments)
            .enter()
            .append("li");

        segmentItems.append("input")
            .property("value", function (d) {
                return d;
            })
            .on("change", function () {
                updateStyle(this, child);
            });

        segmentItems.append("button")
            .text("-")
            .on("click", function () {
                this.value = "";
                updateStyle(this, child);

                const parentNode = this.parentNode;
                parentNode.innerHTML = "";
                d3.select(parentNode).remove();
            });


        sublist.append("button")
            .text("+")
            .on("click", function () {

                segmentsList
                    .append("li")
                    //.datum([""])
                    .append("input")
                    .property("value", "")
                    .on("change", function () {
                        updateStyle(this, child);
                    });
            })


    } else {
        const subitem = sublist.append("li").text(name + ": ");

        subitem.append("input")
            .property("value", value)
            .datum({element: child, attribute_name: name})
            .on("change", function (d) {

                if (this.value !== (+this.value).toString()) {
                    // treat as a parametric expression
                    d.element.setAttribute("parametric:" + d.attribute_name, this.value);
                    parametricSVG.getParameters(d.element.attributes);
                    parametricSVG.applyParameters();
                } else {
                    d.element.removeAttribute('parametric:' + d.attribute_name);
                    d.element.setAttribute(d.attribute_name, this.value);
                }
            });

        subitem.append("button")
            .datum({element: child, attribute_name: name})
            .text("-")
            .on("click", function (d) {

                d.element.removeAttribute('parametric:' + d.attribute_name);
                d.element.removeAttribute(d.attribute_name);

                subitem.node().innerHTML = "";
                subitem.remove();
            })
    }
}


function updateParamsList() {

    // add inputs for any newly-created parameters
    for (let p in parametricSVG.parameters) {

        if (!d3.select("#parameter-" + p).empty()) {
            continue;
        }

        d3.select("#paramList")
            .append("li")
            .text(p + ": ")
            .datum(p)
            .append("input")
            .attr("id", "parameter-" + p)
            .property("value", parametricSVG.parameters[p])
            .on("change", function (d) {

                if (this.value === (+this.value).toString()) {
                    parametricSVG.parameters[d] = +this.value;
                } else {
                    parametricSVG.parameters[d] = this.value;
                }

                parametricSVG.applyParameters();
            });
    }
}

function addNodeToList(child) {
    // Add list item for a tag/element
    let element_list = d3.select("#elementList");
    parametricSVG.getParameters(child.attributes);

    if (child.tagName) {
        const tag_item = element_list.append("li").text(child.tagName);

        tag_item.append("button")
            .text("-")
            .datum(child)
            .on("click", function () {
                child.innerHTML = "";
                d3.select(child).remove();

                const parentNode = this.parentNode;
                parentNode.innerHTML = "";
                d3.select(parentNode).remove();
            });

        const sublist = tag_item.append("ul");


        if (child.attributes) {
            for (let j = 0; j < child.attributes.length; j++) {
                const attribute = child.attributes[j];

                let name = attribute.name;

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
            .on("click", function (d) {
                const name = prompt('Name');
                addItem(sublist, name, "", d.child)
            })
    }
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
                JSON.stringify(parametricSVG.parameters)
            )
        });



    let svgString = `<svg  version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:parametric="https://parametric-svg.github.io/v0.2"
        width="500"
        height="500"
        parametric:defaults="x=60;y=60;d=5">
<circle parametric:cx="{x + d}" parametric:cy="{y}" r="40" stroke="black" stroke-width="3" fill="blue" />
<circle parametric:cx="{x}" parametric:cy="{y}" r="40" stroke="black" stroke-width="3" fill="green" />
</svg>`;

    importSVG(svgString);

    parametricSVG.getDefaultParamValues();
    parametricSVG.applyParameters();
}

function splitPath(pathString) {
    // Splits a SVG path d attribute into individual commands and return as an array

    let i = 0, k = 1;
    let segments = [];

    for (k = 1; k < pathString.length; k++) {
        // Only split on command character if followed by a space (or it is a Z at end of string)
        if (pathString.substr(k).match(/^[mlhvcsqa] /i) || pathString.substr(k).match(/^z$|^z /i)) {
            segments.push(pathString.substring(i, k).trim());
            i = k;
        }
    }

    if (i < k) {
        segments.push(pathString.substring(i).trim());
    }

    return segments;
}
