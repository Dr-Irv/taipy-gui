/*
 * Copyright 2023 Avaiga Private Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

import React, { useState, useContext, useCallback, useEffect, useMemo, SyntheticEvent, HTMLAttributes, forwardRef, Ref } from "react";
import Box from "@mui/material/Box";
import MuiTreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem, { TreeItemContentProps, useTreeItem, TreeItemProps } from "@mui/lab/TreeItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { TaipyContext } from "../../context/taipyContext";
import { createSendUpdateAction } from "../../context/taipyReducers";
import {
    boxSx,
    isLovParent,
    LovImage,
    paperBaseSx,
    SelTreeProps,
    showItem,
    treeSelBaseSx,
    useLovListMemo,
} from "./lovUtils";
import { useClassNames, useDispatchRequestUpdateOnFirstRender, useDynamicProperty } from "../../utils/hooks";
import { LovItem } from "../../utils/lov";
import { getUpdateVar } from "./utils";
import { Icon } from "../../utils/icon";

const CustomContent = forwardRef(function CustomContent(props: TreeItemContentProps, ref) { // need a display name
    const { classes, className, label, nodeId, icon: iconProp, expansionIcon, displayIcon } = props;
    const { allowSelection, lovIcon, height } = props as unknown as CustomTreeProps;

    const { disabled, expanded, selected, focused, handleExpansion, handleSelection, preventSelection } =
        useTreeItem(nodeId);

    const icon = iconProp || expansionIcon || displayIcon;

    const classNames = [className, classes.root];
    if (expanded) {
        classNames.push(classes.expanded);
    }
    if (selected) {
        classNames.push(classes.selected);
    }
    if (allowSelection && focused) {
        classNames.push(classes.focused);
    }
    if (disabled) {
        classNames.push(classes.disabled);
    }
    const divStyle = useMemo(() => (height ? {height: height}: undefined), [height]);

    return (
        <div
            className={classNames. join(" ")}
            onMouseDown={preventSelection}
            ref={ref as Ref<HTMLDivElement>}
            style={divStyle}
        >
            <div onClick={handleExpansion} className={classes.iconContainer}>
                {icon}
            </div>
            <Typography onClick={allowSelection ? handleSelection : handleExpansion} component="div" className={classes.label}>
                {lovIcon ? <LovImage item={lovIcon} disableTypo={true} height={height} /> : label}
            </Typography>
        </div>
    );
});

interface CustomTreeProps extends HTMLAttributes<HTMLElement>{
    allowSelection: boolean;
    lovIcon?: Icon;
    height?: string;
}

const CustomTreeItem = (props: TreeItemProps & CustomTreeProps ) => {
    const {allowSelection, lovIcon, height, ...tiProps} = props;
    const ctProps = {allowSelection, lovIcon, height} as CustomTreeProps;
    return <TreeItem ContentComponent={CustomContent} ContentProps={ctProps} {...tiProps} />
}

const renderTree = (lov: LovItem[], active: boolean, searchValue: string, selectLeafsOnly: boolean, rowHeight?: string) => {
    return lov.map((li) => {
        const children = li.children ? renderTree(li.children, active, searchValue, selectLeafsOnly, rowHeight) : [];
        if (!children.filter((c) => c).length && !showItem(li, searchValue)) {
            return null;
        }
        return (
            <CustomTreeItem
                key={li.id}
                nodeId={li.id}
                label={typeof li.item === "string" ? li.item : "undefined item"}
                disabled={!active}
                allowSelection={selectLeafsOnly ? (!children || children.length == 0) : true}
                lovIcon={typeof li.item !== "string" ? li.item as Icon : undefined}
                height={rowHeight}
            >
                {children}
            </CustomTreeItem>
        );
    });
};

interface TreeViewProps extends SelTreeProps {
    defaultExpanded?: string | boolean;
    expanded?: string[] | boolean;
    selectLeafsOnly?: boolean;
    rowHeight?: string;
}

const TreeView = (props: TreeViewProps) => {
    const {
        id,
        defaultValue = "",
        value,
        updateVarName = "",
        defaultLov = "",
        filter = false,
        multiple = false,
        propagate = true,
        lov,
        updateVars = "",
        width = 360,
        height,
        valueById,
        selectLeafsOnly = false,
        rowHeight
    } = props;
    const [searchValue, setSearchValue] = useState("");
    const [selectedValue, setSelectedValue] = useState<string[] | string>(multiple ? [] : "");
    const [oneExpanded, setOneExpanded] = useState(false);
    const [refreshExpanded, setRefreshExpanded] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
    const { dispatch } = useContext(TaipyContext);

    const className = useClassNames(props.libClassName, props.dynamicClassName, props.className);
    const active = useDynamicProperty(props.active, props.defaultActive, true);
    const hover = useDynamicProperty(props.hoverText, props.defaultHoverText, undefined);

    useDispatchRequestUpdateOnFirstRender(dispatch, id, updateVars, updateVarName);

    const lovList = useLovListMemo(lov, defaultLov, true);
    const treeSx = useMemo(() => ({ ...treeSelBaseSx, maxWidth: width }), [width]);
    const paperSx = useMemo(
        () => (height === undefined ? paperBaseSx : { ...paperBaseSx, maxHeight: height }),
        [height]
    );

    useEffect(() => {
        let refExp = false;
        let oneExp = false;
        if (props.expanded === undefined) {
            if (typeof props.defaultExpanded === "boolean") {
                oneExp = !props.defaultExpanded;
            } else if (typeof props.defaultExpanded === "string") {
                try {
                    const val = JSON.parse(props.defaultExpanded);
                    if (Array.isArray(val)) {
                        setExpandedNodes(val.map((v) => "" + v));
                    } else {
                        setExpandedNodes(["" + val]);
                    }
                    refExp = true;
                } catch (e) {
                    console.info(`Tree.expanded cannot parse property\n${(e as Error).message || e}`);
                }
            }
        } else if (typeof props.expanded === "boolean") {
            oneExp = !props.expanded;
        } else {
            try {
                if (Array.isArray(props.expanded)) {
                    setExpandedNodes(props.expanded.map((v) => "" + v));
                } else {
                    setExpandedNodes(["" + props.expanded]);
                }
                refExp = true;
            } catch (e) {
                console.info(`Tree.expanded wrongly formatted property\n${(e as Error).message || e}`);
            }
        }
        setOneExpanded(oneExp);
        setRefreshExpanded(refExp);
    }, [props.defaultExpanded, props.expanded]);

    useEffect(() => {
        if (value !== undefined) {
            setSelectedValue(
                multiple ? (Array.isArray(value) ? value : [value]) : Array.isArray(value) ? value[0] : value
            );
        } else if (defaultValue) {
            let parsedValue;
            try {
                parsedValue = JSON.parse(defaultValue);
            } catch (e) {
                parsedValue = defaultValue;
            }
            setSelectedValue(
                multiple
                    ? Array.isArray(parsedValue)
                        ? parsedValue
                        : [parsedValue]
                    : Array.isArray(parsedValue)
                    ? parsedValue[0]
                    : parsedValue
            );
        }
    }, [defaultValue, value, multiple]);

    const clickHandler = useCallback(
        (event: SyntheticEvent, nodeIds: string[] | string) => {
            setSelectedValue(nodeIds);
            updateVarName &&
                dispatch(
                    createSendUpdateAction(
                        updateVarName,
                        Array.isArray(nodeIds) ? nodeIds : [nodeIds],
                        props.onChange,
                        propagate,
                        valueById ? undefined : getUpdateVar(updateVars, "lov")
                    )
                );
        },
        [updateVarName, dispatch, propagate, updateVars, valueById, props.onChange]
    );

    const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value), []);

    const handleNodeToggle = useCallback(
        (event: React.SyntheticEvent, nodeIds: string[]) => {
            const expVar = getUpdateVar(updateVars, "expanded");
            if (oneExpanded) {
                setExpandedNodes((en) => {
                    if (en.length < nodeIds.length) {
                        // node opened: keep only parent nodes
                        nodeIds = nodeIds.filter((n, i) => i == 0 || isLovParent(lovList, n, nodeIds[0]));
                    }
                    if (refreshExpanded) {
                        dispatch(createSendUpdateAction(expVar, nodeIds, props.onChange, propagate));
                    }
                    return nodeIds;
                });
            } else {
                setExpandedNodes(nodeIds);
                if (refreshExpanded) {
                    dispatch(createSendUpdateAction(expVar, nodeIds, props.onChange, propagate));
                }
            }
        },
        [oneExpanded, refreshExpanded, lovList, propagate, updateVars, dispatch, props.onChange]
    );

    const treeProps = useMemo(
        () =>
            multiple
                ? { multiSelect: true as true | undefined, selected: selectedValue as string[] }
                : { selected: selectedValue as string },
        [multiple, selectedValue]
    );

    return (
        <Box id={id} sx={boxSx} className={className}>
            <Tooltip title={hover || ""}>
                <Paper sx={paperSx}>
                    <Box>
                        {filter && (
                            <TextField
                                margin="dense"
                                placeholder="Search field"
                                value={searchValue}
                                onChange={handleInput}
                                disabled={!active}
                            />
                        )}
                    </Box>
                    <MuiTreeView
                        aria-label="tree"
                        defaultCollapseIcon={<ExpandMoreIcon />}
                        defaultExpandIcon={<ChevronRightIcon />}
                        sx={treeSx}
                        onNodeSelect={clickHandler}
                        expanded={expandedNodes}
                        onNodeToggle={handleNodeToggle}
                        {...treeProps}
                    >
                        {renderTree(lovList, !!active, searchValue, selectLeafsOnly, rowHeight)}
                    </MuiTreeView>
                </Paper>
            </Tooltip>
        </Box>
    );
};

export default TreeView;
