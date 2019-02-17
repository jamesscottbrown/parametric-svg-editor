class ParametricSVG {


    constructor (svgParentDiv, svgText) {

        let svg = d3.select(svgParentDiv)
            .append('svg')
            .node();

        if (svgText.includes("<svg")) {
            svg.outerHTML = svgText;
        } else {
            svg.innerHTML = svgText;
        }

        svg = d3.select(svgParentDiv).node().lastChild;
        this.svg = svg;

        this.parameters = {};

        let children = this.svg.childNodes;
        for (let i = 0; i < children.length; i++) {
            this.getParameters(children[i].attributes);
        }



    }


     getParameters(attributes) {
        // Given a NamedNodeMap or Array of attributes for a tag, identify any parameters not recorded in the parameters array

        if (!attributes) {
            return;
        }

        // process only the contents of {}
        const re = /\{(.+?)\}/g;

        for (let j = 0; j < attributes.length; j++) {
            const attribute = attributes[j];

            if (attribute.name.startsWith("parametric:")) {
                attribute.nodeValue.replace(re,  (match, g1, g2) => {
                    this.processExpressionTerm(g1)
                });
            }
        }

    }


    processExpressionTerm(term) {
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

            if (!this.parameters[terms[term]]) {
                this.parameters[terms[term]] = 0;
            }
        }

    }



    applyParameters(params) {
        // Substitutes the values in parameters into the SVG
        // svg = svg ? svg : d3.select("parametric-svg").select("svg").node();
        params = params ? params : this.parameters;

        // parametricSvg(svg, parameters);

        const tagNames = ["rect", "circle", "ellipse", "line", "polyline", "polygon",
            "text", "tspan", "tref", "textPath", "altGlyph", "altGlyphDef", "altGlyphItem", "glyphRef",
            "marker", "path"];

        const re = /\{(.+?)\}/g;

        for (let i in tagNames) {

            const tags = this.svg.getElementsByTagName(tagNames[i]);

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
                        tag.setAttribute(name, value);

                        console.log("Set " + name + " to: " + value)

                    }
                }
            }
        }


    }


    getDefaultParamValues(){

        // TODO: rename, as it sets values rather than just returning them

        const defaultAttribute = this.svg.attributes["parametric:defaults"];
        if (defaultAttribute) {
            let assignments = defaultAttribute.nodeValue.split(";");
            let param, value;
            for (let i in assignments) {
                [param, value] = assignments[i].split("=");
                this.parameters[param] = value;

                d3.select("#parameter-" + param)
                    .property("value", value);
            }
        }

        return this.parameters;
    }


}