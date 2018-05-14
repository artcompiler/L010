/* Copyright (c) 2018, Art Compiler LLC */
/* @flow */
/*
  TODO
  xx pass obj to update.
  -- call hierarchy() on obj to make a renderable tree
  -- render using tree()

*/
import {
  assert,
  message,
  messages,
  reserveCodeRange,
  decodeID,
  encodeID,
} from "./share.js";
import * as React from "react";
import * as d3 from "d3";
import { linkRadial, linkHorizontal } from "d3-shape";
window.gcexports.viewer = (function () {
  const capture = (el) => {
    return null;
  };
  const getWindowSize = () => {
    let width = window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth;
    let height =
      window.gcexports.height ||
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.body.clientHeight;
    return {
      width: width - 20,
      height: height,
    };
  };
  const nodeFromObject = (name, obj) => {
    if (typeof obj !== "object" || obj === null) {
      return {
        name: name,
        children: [{
          name: "" + obj,
        }],
      };
    }
    let children = [];
    Object.keys(obj).forEach(key => {
      if (false && obj instanceof Array) {
        // If it's an array, skip the index name.
        let child = nodeFromObject(key, obj[key]);
        children = children.concat(child.children);
      } else {
        children.push(nodeFromObject(key, obj[key]));
      }
    });
    if (name === "root" && children.length === 1) {
      return children[0];
    } else {
      return {
        name: name,
        children: children,
      };
    }
  };
  const update = (obj) => {
    const doRadial = false;
    var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    g = svg.append("g").attr("transform", doRadial
                             ? "translate(" + (width / 2 + 40) + "," + (height / 2 + 40) + ")"
                             : "translate(40,0)");
    let size = width < height ? width : height;
    var tree = d3.tree()
      .size(doRadial 
         ? [2 * Math.PI, size / 2 - 100]
         : [height, width - 160])
      .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

    let data = nodeFromObject("root", obj);
    var root = tree(d3.hierarchy(data));
    var link = g.selectAll(".link")
      .data(root.links())
      .enter().append("path")
      .attr("class", "link")
      .attr("d", doRadial
            ? linkRadial()
                .angle(function(d) { return d.x; })
                .radius(function(d) { return d.y; })
            : linkHorizontal()
                .x(function(d) { return d.y; })
                .y(function(d) { return d.x; }));

    var node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
      .attr("transform", function(d) { return doRadial
          ? "translate(" + radialPoint(d.x, d.y) + ")"
          : "translate(" + d.y + "," + d.x + ")"; });
    node.append("circle")
      .attr("r", 2.5);

    node.append("text")
      .attr("dy", doRadial
          ? "0.31em"
          : "3")
      .attr("x", function(d) {
        return doRadial
          ? d.x < Math.PI === !d.children ? 6 : -6
          : d.children ? -8 : 8;
      })
      .style("text-anchor", function(d) {
        return doRadial
          ? d.x < Math.PI === !d.children ? "start" : "end"
          : d.children ? "end" : "start"; })
      .attr("transform", function(d) {
        return doRadial
          ? "rotate(" + (d.x < Math.PI ? d.x - Math.PI / 2 : d.x + Math.PI / 2) * 180 / Math.PI + ")"
          : "rotate(0)" })
      .text(function(d) { return d.data.name; });

    function radialPoint(x, y) {
      return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
    }
  }
  const Viewer = React.createClass({
    componentDidMount: function() {
      update(this.props.obj);
    },
    componentDidUpdate: function() {
      update(this.props.obj);
    },
    render: function () {
      let {width, height} = getWindowSize();
      return (
        <div className="L010 viewer">
          <link rel="stylesheet" href="https://l010.artcompiler.com/style.css" />
          <svg width={width} height={height}></svg>
        </div>
      );
    },
  });
  return {
    capture: capture,
    Viewer: Viewer
  };
})();
