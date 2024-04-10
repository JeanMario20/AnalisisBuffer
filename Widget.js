///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/on",
  "dojo/dom-construct",
  "esri/layers/FeatureLayer",
  "esri/graphic",
  "esri/geometry/Polyline",
  "esri/geometry/geometryEngine",
  "esri/symbols/SimpleFillSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/Color",
  "esri/layers/GraphicsLayer",
  "esri/tasks/query",
  "esri/tasks/QueryTask",
  "esri/tasks/Geoprocessor",
  "esri/dijit/analysis/AnalysisBase",
  "esri/dijit/analysis/CreateBuffers",
  "jimu/BaseWidget",
  "jimu/utils",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/form/TextBox",
  "jimu/dijit/formSelect",
], function (
  declare,
  lang,
  on,
  domConstruct,
  FeatureLayer,
  Graphic,
  Polyline,
  geometryEngine,
  SimpleFillSymbol,
  SimpleLineSymbol,
  Color,
  GraphicsLayer,
  Query,
  QueryTask,
  Geoprocessor,
  AnalysisBase,
  CreateBuffers,
  BaseWidget,
  jimuUtils,
  _WidgetsInTemplateMixin
) {
  var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
    name: "AnalisisBuffer",
    baseClass: "jimu-widget-analisis_buffer",

    _hasContent: null,
    _isOpen: false,
    _ductSelect: null,
    polyline: null,
    glyDucto: null,
    graphicsLayerBuffer: null,
    qryResultDucto: null,

    postCreate: function () {
      this.inherited(arguments);
      // this._ductSelect
      this._setConfigDefaults();
    },

    startup: function () {
      this.inherited(arguments);
      this.glyDucto = new GraphicsLayer({ id: "glyDucto" });
      this.glyBuffer = new GraphicsLayer({ id: "glyBuffer" });
      this.map.addLayer(this.glyDucto);
      this.map.addLayer(this.glyBuffer);
      this._getDuctos();
    },

    onClose: function () {
      this.inherited(arguments);
    },

    destroy: function () {
      this.inherited(arguments);
    },

    _setConfigDefaults: function () {
      // Set Default Radii based on configured options
      this._setRadii(
        this.config.ringDefaults,
        this.distanceBuffer1,
        this.distanceBuffer2
      );
      this.unitSelect.set("value", this.config.ringUnitDefault);
      // this._getDuctos();
    },

    _getDuctos: function (_where = "1=1", _returnGeometry = false) {
      var self = this;
      var query = new Query();
      var queryTask = new QueryTask(
        "https://procesosgis.sigsa.info/server/rest/services/INFRAESTRUCTURA_EXISTENTE/MapServer/84"
      );
      query.where = _where; // "STATE_NAME = 'Washington'";
      // query.outSpatialReference = { wkid: 102100 };
      query.returnGeometry = _returnGeometry;
      query.outFields = ["OBJECTID", "NOMBRE"];
      query.orderByFields = ["NOMBRE"];

      if (_returnGeometry == false) {
        queryTask.execute(
          query,
          (queryResults) => {
            console.log("_callback_getDuctos", queryResults);
            let ductos = queryResults.features;
            var options = [],
              option;
            for (let item of ductos) {
              option = {
                value: item.attributes.OBJECTID,
                label: item.attributes.NOMBRE,
              };
              options.push(option);
            }
            self.ductSelect.addOption(options);
            this._onDuctSelectChanged();
            // if (options && typeof options[0].label === 'string') {
            // self.ductSelect.set('value', options[0].value);
            // }
          },
          self.queryTaskErrorHandler
        );
      } else {
        queryTask.execute(
          query,
          (queryResults) => {
            // self.graphicsLayer.graphics.clear();
            self.qryResultDucto = queryResults;
            self.glyDucto.clear();
            self.map.graphics.clear();
            var simpleLineSymbol = new SimpleLineSymbol();
            simpleLineSymbol.setColor(new Color([0, 0, 0, 10]));
            self.polyline = new Polyline(queryResults.features[0].geometry);
            var polyLineGraphic = new Graphic(self.polyline, simpleLineSymbol);
            polyLineGraphic.attributes = {
              id: "polyline_manual",
              ...queryResults.features[0].attributes,
            };
            self.glyDucto.add(polyLineGraphic);

            // self.map.addLayer(self.glyDucto);
            self.map.setExtent(polyLineGraphic.geometry.getExtent().expand(3));
          },
          self.queryTaskErrorHandler
        );
      }
    },

    queryTaskExecuteCompleteHandler: function (queryResults) {
      console.log("complete", queryResults);
    },

    queryTaskErrorHandler: function (queryError) {
      console.log("error", queryError.error.details);
    },

    _getRadii: function (textBox1, textBox2) {
      var value1 = textBox1.get("value"),
        value2 = textBox2.get("value"),
        returnRadii = [];

      if (value1 !== "") returnRadii.push(value1);

      if (value2 !== "") returnRadii.push(value2);

      return returnRadii;
    },

    _setRadii: function (radii, textBox1, textBox2) {
      if (radii.length > 0) textBox1.set("value", radii[0]);
      else textBox1.set("value", "");

      if (radii.length > 0) textBox2.set("value", radii[1]);
      else textBox2.set("value", "");
    },

    _onUnitSelectChanged: function () {
      this._emitEvent();
    },

    _emitEvent: function () {
      var data = this.getData();
      if (data.meters !== this.lastMeters) {
        this.lastMeters = data.meters;
        this.emit("change", data);
      }
    },

    _onDuctSelectChanged: function () {
      // this._emitEvent();
      var value = this.ductSelect.get("value");
      this._getDuctos((_where = "OBJECTID=" + value), (_returnGeometry = true));
    },

    _onPlaceholderBlur: function () {
      this.placeholder.set(
        "value",
        jimuUtils.stripHTML(this.placeholder.get("value"))
      );
    },

    ejecutarAnalisis: function () {
      var distance = this.distanceBuffer1.get("value");
      var distanceUnit = this.unitSelect.get("value");
      var buffer = geometryEngine.geodesicBuffer(
        this.polyline,
        distance,
        distanceUnit,
        true
      );
      var simpleFillSymbol = new SimpleFillSymbol();
      var line = new SimpleLineSymbol();
      line.setStyle(SimpleLineSymbol.STYLE_NULL);
      simpleFillSymbol.setColor(new Color([180, 235, 0, 0.25]));

      var bufferGraphic = new Graphic(buffer, simpleFillSymbol, line);
      this.glyBuffer.clear();
      this.glyBuffer.add(bufferGraphic);
      // this.map.addLayer(this.glyBuffer);
      var value = this.ductSelect.get("value");
      gp = new Geoprocessor(
        "https://procesosgis.sigsa.info/server/rest/services/System/SpatialAnalysisTools/GPServer/CreateBuffers"
      );
      var params = {
        inputLayer: JSON.stringify({"features": this.qryResultDucto.features
            // "layerDefinition": {
            //   "geometryType": this.qryResultDucto.geometryType,
            //   "fields": this.qryResultDucto.fields
            // },
            // "featureSet": {
            //   "geometryType": this.qryResultDucto.geometryType,
            //   "spatialReference": this.qryResultDucto.spatialReference,
            //   "fields": this.qryResultDucto.fields,
            //   "features": this.qryResultDucto.features
            // }
        }),
        distances: [500.0],
        units: "Meters",
        dissolveType: "None",
        ringType: "Disks",
        sideType: "Full",
        endType: "Round",
      };
      // gp.execute(params, drawRestaurants => {
      //   console.log(drawRestaurants);
      // });
      gp.submitJob(params,
        gpJobComplete => {
          console.log(gpJobComplete);
          gp.getResultData(gpJobComplete.jobId, "bufferLayer", displayResult => {
            console.log(displayResult);
          });
        }, gpJobStatus => {
          console.log(gpJobStatus);
        }, gpJobFailed => {
          console.log(gpJobFailed);
        }
      );
    },

    ejecutarAnalisisKeydown: function (evt) {
      if (
        (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE) &&
        !html.hasClass(this.ejecutarAnalisisBtn, "jimu-state-disabled")
      ) {
        // this.clearGraphics();
      }
    },

    informe: function () {
      // html.addClass(this.informeBtn, 'jimu-state-disabled');
      // html.attr(this.informeBtn, "aria-label", this._clearDisabledLabel);
    },

    informeKeydown: function (evt) {
      if (
        (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE) &&
        !html.hasClass(this.informeBtn, "jimu-state-disabled")
      ) {
        // this.clearGraphics();
      }
    },
  });
  return clazz;
});
