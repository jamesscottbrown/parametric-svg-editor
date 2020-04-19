import React from 'react';

const ParameterList = ({params, updateParameter, defaultParams, tree}) => {
    return <>
        <h2>Parameters</h2>

        {Object.keys(params).map(paramName => {
                return <li key={`li-${paramName}`}>
                    <label htmlFor={`input-${paramName}`} key={`label-${paramName}`}>{paramName}</label>:
                    <input id={`input-${paramName}`} defaultValue={params[paramName]} key={`param-${paramName}`} onChange={ev => updateParameter(paramName, ev.target.value)} />
                </li>;
            }
        )}
    </>;

};

export default ParameterList;

