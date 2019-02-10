let parameters = {'x': 60, "y": 60, "d": 5};

function importSVG(svgText) {
    // Load an SVg or parametric SVG from a string

    // clear param list
    const codePanel = d3.select("#parameter-list");
    codePanel.node().innerHTML = "";
    codePanel.append("ul").attr("id", "paramList");

    // clear element list
    const elements = d3.select("#elements");
    elements.node().innerHTML = "";
    elements.append("ul").attr("id", "elementList");

    parameters = {};

    if (!svgText) {
        return;
    }

    let svg = document.querySelector('svg');
    createSVG(svg, svgText);
    svg = document.querySelector('svg'); // reference will be lost if outerHTML was changes


    let children = svg.childNodes;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        // TODO: need to igo deeper for <g>
        // child.id
        // child.classList
        // child.attributes

        addNodeToList(child)
    }

    // Load default parameter values
    parameters = getDefaultParamValues(svg);
    for (let paramName in parameters){
        d3.select("#parameter-" + paramName)
            .property("value", parameters[paramName]);
    }

    elements.append("button")
        .text("Add Element")
        .on("click", addElement)

}

function createSVG(svg, svgText){
    if (svgText.includes("<svg")) {
        svg.outerHTML = svgText;
    } else {
        svg.innerHTML = svgText;
    }
}

function getDefaultParamValues(svg){

    if (!parameters){
        parameters = {};

        let children = svg.childNodes;
        for (let i = 0; i < children.length; i++) {
            getParameters(children[i].attributes);
        }

    }


    const defaultAttribute = svg.attributes["parametric:defaults"];
    if (defaultAttribute) {
        let assignments = defaultAttribute.nodeValue.split(";");
        let param, value;
        for (let i in assignments) {
            [param, value] = assignments[i].split("=");
            parameters[param] = value;

            d3.select("#parameter-" + param)
                .property("value", value);
        }
    }
    return parameters;
}


function addNodeToList(child) {
    // Add list tiem for a tag/element
    let element_list = d3.select("#elementList");
    getParameters(child.attributes);

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

function addElement() {
    const type = prompt("Tag name");
    const child = d3.select("svg").append(type).node();
    addNodeToList(child);
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
        getParameters(child.attributes);
        applyParameters();
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

        getParameters([{name: "parametric:style", nodeValue: val}]);
        applyParameters();
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
    for (let p in parameters) {

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

                if (this.value === (+this.value).toString()) {
                    parameters[d] = +this.value;
                } else {
                    parameters[d] = this.value;
                }

                applyParameters();
            });
    }


}


function processExpressionTerm(term) {
    const expression = term
        .replace(/\{/g, '')
        .replace(/\(/g, '')
        .replace(/\)/g, '')
        .replace(/\}/g, '')
        .replace(/\+/g, ' ')
        .replace(/\-/g, ' ')
        .replace(/\^/g, ' ')
        .replace(/\//g, ' ')
        .replace(/\*/g, ' ')
        .replace(/,/g, ' ')
        .replace(/'/g, ' ');

    const terms = expression.split(" ");

    for (let term in terms) {
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

    // process only the contents of {}
    const re = /\{(.+?)\}/g;

    for (let j = 0; j < attributes.length; j++) {
        const attribute = attributes[j];

        if (attribute.name.startsWith("parametric:")) {
            attribute.nodeValue.replace(re, function (match, g1, g2) {
                processExpressionTerm(g1)
            });
        }
    }

    updateParamsList();
}


function applyParameters(svg, params) {
    // Substitutes the values in parameters into the SVG
    svg = svg ? svg : d3.select("parametric-svg").select("svg").node();
    params = params ? params : parameters;

    // parametricSvg(svg, parameters);

    const tagNames = ["rect", "circle", "ellipse", "line", "polyline", "polygon",
        "text", "tspan", "tref", "textPath", "altGlyph", "altGlyphDef", "altGlyphItem", "glyphRef",
        "marker", "path"];

    const re = /\{(.+?)\}/g;

    for (let i in tagNames) {

        const tags = svg.getElementsByTagName(tagNames[i]);

        for (let j in tags) {
            let tag = tags[j];
            for (let k in tag.attributes) {
                let name = tag.attributes[k].name;
                let value = tag.attributes[k].nodeValue;

                if (name && name.startsWith("parametric:")) {

                    name = name.substr(11);
                    value = value.replace(re, function (match, g1, g2) {
                        return math.eval(g1, params)
                    });
                    tag.setAttribute(name, value)
                }
            }
        }
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
                JSON.stringify(parameters)
            )
        });

    importSVG('<circle parametric:cx="{x + d}" parametric:cy="{y}" r="40" stroke="black" stroke-width="3" fill="blue" />\n' +
        '  <circle parametric:cx="{x}" parametric:cy="{y}" r="40" stroke="black" stroke-width="3" fill="green" />\n');

    applyParameters();
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
