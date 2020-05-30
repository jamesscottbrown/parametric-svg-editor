import React, { useState }  from 'react';
import './App.css';


import ParameterList from './ParameterList';
import ElementList from "./ElementList";


import {parseParametricSVG, PreviewSVG} from 'react-parametric-svg';

import { UnControlled as CodeMirror } from 'react-codemirror2';

import 'codemirror/mode/shell/shell';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';


const defaultSVGString = `<svg  version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:parametric="https://parametric-svg.github.io/v0.2"
        width="500"
        height="500"
        parametric:defaults="x=60;y=60;d=5">
<circle parametric:cx="{x + d}" parametric:cy="{y}" r="40" stroke="black" stroke-width="3" fill="blue" />
<circle parametric:cx="{x}" parametric:cy="{y}" r="40" stroke="black" stroke-width="3" fill="green" />
</svg>`;

function App() {

    const [params, setParams] = useState(null);
    const [defaultParams, setDefaultParams] = useState(null);
    const [tree, setTree] = useState(null);
    const [svgString, setSVGString] = useState(defaultSVGString);

    const [cmContents, setCMContents] = useState(null);

    const updateParameter = (param, value) => {

        const newParams = {...params, [param]: value};
        setParams(newParams);

        const newParamsString = Object.keys(newParams).map(n => `${n}=${newParams[n]}`).join(';');

        const newSVGAttributes = tree.attributes.map(attr => ({
            name: attr.name,
            value: attr.name === "parametric:defaults" ? newParamsString : attr.value}));

        const newTree = {...tree, attributes: newSVGAttributes};
        setTree(newTree);

       // newTree
    };

    const updateTree = (newTree) => {
        setTree(JSON.parse(JSON.stringify(newTree)));
    };

    const updateSVGString = () => {
        const rawSVG = document.getElementById('svg-panel').getElementsByTagName('svg')[0].outerHTML;
        //const formattedSVG = rawSVG.replace(/>/g,  ">\n"); // There is scope for improvement here...

        if (rawSVG !== svgString ){
            setSVGString(rawSVG);
            applySVGString(rawSVG);
        }
    };



    const applySVGString = (newSVGString) => {
        const {parameters, defaultParameters, tree} = parseParametricSVG(newSVGString);

        setParams({...parameters, ...defaultParameters}); // apply defaults where they were defined
        setDefaultParams(defaultParameters);
        setTree(tree);
    };

    if (!params){
        applySVGString(svgString);
    }

    const handleSVGStringEdit = (value) => {
       //  setSVGString(value); // this would a re-render, which re-draws the SVG (but form the tree rather than the svg string); PreviewSVG calls updateSVGString, which replaces the svg sring with what has been rendered
        applySVGString(value);
    };

    /*
    let psvg = new ParametricSVG(svgString);
    const newParams = {...psvg.params, ...psvg.defaultParameters};
    if (JSON.stringify(params) !== JSON.stringify(newParams)){setParams(newParams)}
    if (JSON.stringify(defaultParams) !== JSON.stringify(psvg.defaultParameters)){ setDefaultParams(psvg.defaultParameters)}
    if (JSON.stringify(tree) !== JSON.stringify(psvg.tree)){ setTree(psvg.tree) }
*/



/*
     if (!params){
            let psvg = new ParametricSVG(svgString);

            setParams({...psvg.params, ...psvg.defaultParameters}); // apply defaults where they were defined
            setDefaultParams(psvg.defaultParameters);
            setTree(psvg.tree);

     } else {
         console.log(`Params is true: ${JSON.stringify(params)}`)
     }

*/



    const loadSVGString = (string) =>{
         // need to do several things:
        // re-parse, to set params/default params
        // set svgString
    }


    let cmOptions = {
        lineNumberFormatter: _ => '',
        lineNumbers: true,
        lineWrapping: true,
        // mode: Constants.CodeMirror.Mode.SHELL,
        //readOnly: true,
        value: svgString,
        theme: 'dracula'
    };


     var codeMirrorEditor;
     let codeMirrorEditor2;
  return (

<div>

    <div className="page-header">
        <h1>Parametric SVG editor</h1>
        <p className="lead">An editor for SVG images in which attributes can contain parameters.</p>
      </div>

    <div className="parent">
        <div className="div1" id="code-panel">

            <div id="parameters">
                <ParameterList params={params} defaultParams={defaultParams} updateParameter={updateParameter}/>
            </div>

            <div id="elements">
                <ElementList tree={tree}  params={params} defaultParams={defaultParams} updateTree={updateTree}/>
            </div>


        </div>

        <div className="div2" id="svg-panel">
            <PreviewSVG tree={tree} params={params} defaultParams={defaultParams} updateSVGString={updateSVGString}/>
        </div>

    </div>

    <CodeMirror value={svgString}  onBlur={() => null} options={cmOptions} onChange={(Editor, data, value) => {setCMContents(value)}}  />


    <button onClick={(ev) => {
        applySVGString(cmContents); // TODO: this updates the SVG, but changes do no propogate to the elements list
    }} > Update!</button>

    </div>
  );
}

//onChange={(editor, data, value) => {handleSVGStringEdit(value)}}










export default App;
