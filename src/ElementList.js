import React from 'react';
import { FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlus, faTrash} from "@fortawesome/free-solid-svg-icons";

const Element = ({tree, updateTree, i, deleteFunc}) => {

    const updateTreeHere = (newSubTree, i) => {
        // replace the correct subtree, then propogate upwards
        let newTree = JSON.parse(JSON.stringify(tree));
        newTree.children[i] = newSubTree;
        updateTree(newTree)
    };

    const addAttribute= () => {
      const attrName = prompt("Attribute name", "fill");

      if (attrName){
        tree.attributes.push({
            "name": attrName,
            "value": ""
        });
        updateTree(tree);
      }
    };

    const deleteAttribute = (attrName) => {
        tree.attributes = tree.attributes.filter(attr => attr.name !== attrName);
        updateTree(tree);
    };

    const deleteChildElement = (i) => {
        tree.children.splice(i, 1); // remove i'th child
        updateTree(tree);
    };

    return <>

        <li>{tree.tagName} <button onClick={deleteFunc}><FontAwesomeIcon icon={faTrash} /></button>

        <ul>
            {tree.attributes.map(attr => {

                const updateElement = (changedAttr, value) => {
                    const newAttributes = tree.attributes.map( a => ({name: a.name, value: (a.name === changedAttr) ? value : a.value} ) );
                    updateTree({...tree, attributes: newAttributes}, i)
                };

                const disabled = tree.attributes.map(a => a.name).includes(`parametric:${attr.name}`);

                return <li>
                    <label htmlFor={`input-${attr.name}`} key={`label-${attr.name}`}>{attr.name}</label>:
                    <input id={`input-${attr.name}`} disabled={disabled} value={attr.value} key={`param-${attr.name}`} onChange={ev => updateElement(attr.name, ev.target.value)}/>
                    <button onClick={() => deleteAttribute(attr.name)}><FontAwesomeIcon icon={faTrash} /></button>
                </li>
            })}
            <button onClick={addAttribute}><FontAwesomeIcon icon={faPlus} /></button>
        </ul>


        <ul>
            {tree.children.map( (child, i) => <Element tree={child} updateTree={updateTreeHere} i={i} deleteFunc={() => deleteChildElement(i)} />)}
        </ul>

        </li>

    </>
};


const ElementList = ({tree, updateTree}) => {

    const addElement = () => {
      const tagName = prompt("Tag name", "rect");

      if (tagName){
        tree.children.push({
            "tagName": tagName,
            "id": "",
            "className": {},
            "attributes": [],
            "children": []
        });
        updateTree(tree);
      }
    };

    return <>
        <h2>Elements</h2>
        <Element tree={tree} updateTree={updateTree} i={0} />
        <button onClick={addElement}><FontAwesomeIcon icon={faPlus} /></button>
    </>;
};

export default ElementList;

