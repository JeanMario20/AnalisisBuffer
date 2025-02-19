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
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/on',
  'dojo/dom-construct',
  'dijit/_WidgetsInTemplateMixin',  
  'jimu/BaseWidgetSetting',
  "dijit/form/TextBox"
],
function(declare, lang, on, domConstruct, _WidgetsInTemplateMixin, BaseWidgetSetting) {
  return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-analisis_buffer-setting',
    layout: null,

    postCreate: function () {
      this.inherited(arguments);

      // this._setConfigDefaults();     
    },

    startup: function () {
      this.inherited(arguments);
    },

    destroy: function () {
      this.inherited(arguments);
    },

  });
});