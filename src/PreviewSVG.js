import React, {useEffect} from 'react';
import * as math from 'mathjs';


const re = /\{(.+?)\}/g;

const Element = ({tree, params, defaultParams}) => {

    //const CustomTag = `${tree.tagName}`;
    //return <CustomTag> {tree.children.map(child => <Element tree={child} params={params} defaultParams={defaultParams} />) } </CustomTag>

    var attributes = {};
    const attribute_names = tree.attributes.map(d => d.name);

    for (let i in tree.attributes) {
        let name = tree.attributes[i].name;
        let value = tree.attributes[i].value;


        if (name && name.startsWith("parametric:")) {

            attributes[name] = value; // save the parametric version

            value = value.replace(re, function (match, g1, g2) {
                try {
                    return math.evaluate(g1, params)
                } catch (err) {
                    return null;
                }

            });
            attributes[name.replace('parametric:', '')] = value; // save version with paramater values substituted
        } else if (!attribute_names.includes('parametric:' + name)){
            attributes[name] = value;
        } else {
            // this is the non-paramteric version of an attribute: don't replace value substituted above
        }
    }

    const childTags = tree.children.map(child => <Element tree={child} params={params} defaultParams={defaultParams}/>);
    return React.createElement(tree.tagName, attributes, childTags);
};


const PreviewSVG = ({params, defaultParams, tree, updateSVGString}) => {
    useEffect( () => updateSVGString());
    return <Element tree={tree} params={params} defaultParams={defaultParams} />;
};

export default PreviewSVG;

