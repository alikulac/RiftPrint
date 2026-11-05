/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils"
	],
	function (BaseViewChildController, Constants, Utils) {
		"use strict";

		return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.gantt.PersGanttSettings.controller", {
			// before cleanup: SchedulingBoard._setupSettings
			onInit: function () {
				BaseViewChildController.prototype.onInit.apply(this, arguments);
				this._pInitialized = this.controllers.pers.initialized().then(this._init.bind(this));
			},

			initialized: function () {
				return this._pInitialized;
			},

			_init: function () {
				var oSettings;
				if (Utils.isMockRun()) {
					oSettings = {};
				} else {
					var oFeatureModel = this.controllers.pers.getFeatureModel(Constants.sGanttP13nSettings);
					oSettings = oFeatureModel.getProperty("/", "oSettings");
				}

				this.oUIModel.setGanttSettings(oSettings);
				if (oSettings.enableNowLine !== undefined || oSettings.enableCursorLine !== undefined || oSettings.enableVerticalLine !== undefined) {
					this.controllers.ganttContainer.applySettings(oSettings);
				}

				this.controllers.ganttContainer.setCondensed(oSettings.bCondensedModeActive);
			},

			// before cleanup: SchedulingBoard.persistSettingsP13n
			save: function () {
				var oSettings = this.oUIModel.getP13NSettings();
				var oContainerSettings = this.controllers.ganttContainer.getSettings();
				Object.assign(oSettings, oContainerSettings);
				this.controllers.pers.getFeatureModel(Constants.sGanttP13nSettings).setProperty("/", oSettings);
				this.controllers.pers.save();
			}
		});
	}
);
