import * as math from 'mathjs';

class ParametricSVG {

    constructor (svgString) {

        var virtualParent = document.createElement('div'); // can't set outerHTML of an element with no parent
        var virtualSVG = document.createElement('svg');
        virtualSVG.id = 'VIRTUAL-SVG';

        virtualParent.appendChild(virtualSVG);
        //virtualSVG.innerHTML = svgString;

        if (svgString.includes("<svg")) {
            virtualSVG.outerHTML = svgString;
        } else {
            virtualSVG.innerHTML = svgString;
        }
        virtualSVG = virtualParent.lastChild;

      //  const stripWhitespace = string => string.replace(/ /g, '').replace(/\t/g, '').replace(/\n/g, '');

        if (!virtualSVG ){
            console.log("Skipping update because of error")
            this.error = true;
            return;
        } else {
            console.log("This is fine")
        }

        this.svg = virtualSVG;
        this.parameters = {};
        this.defaultParameters = {};

        let children = virtualSVG.childNodes;
        for (let i = 0; i < children.length; i++) {
            this.getParameters(children[i].attributes);
        }

        this.getDefaultParamValues();


        // Construct tree in JSON reflecting tree in SVG
        this.tree = this.getTree(this.svg);
    }


    getTree(parentNode){
        const childrenArray = [].slice.call(parentNode.children)
        const children = childrenArray.map(child => this.getTree(child));

        return {
            tagName: parentNode.tagName,
            id: parentNode.id,
            className: parentNode.className,
            attributes: [...parentNode.attributes].map(d =>
                ({name: d.name, value: d.value})),
            children: children
        };
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
                            return math.evaluate(g1, params)
                        });
                        tag.setAttribute(name, value);
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
                param = param.trim();
                this.defaultParameters[param] = value;

                // TODO: replaceme
                //d3.select("#parameter-" + param) .property("value", value);
            }
        }

        return this.defaultParameters;
    }


}


export default ParametricSVG;