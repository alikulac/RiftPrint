/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/utils/AppPersContainer",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils"
	],
	function (BaseViewChildController, AppPersContainer, Constants, Utils) {
		"use strict";

		return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.gantt.PersGanttSettings.controller", {
			// before cleanup: SchedulingBoard._setupSettings
			onInit: function () {
				BaseViewChildController.prototype.onInit.apply(this, arguments);
				var oPersContainer = AppPersContainer.getInstance();
				this._pInitialized = oPersContainer.initialized().then(this._init.bind(this));
			},

			initialized: function () {
				return this._pInitialized;
			},
			
			_init: function (oPersContainer) {
				var oSettings;
				if (Utils.isMockRun()) {
					oSettings = {};
				} else {
					var oFeatureModel = oPersContainer.getFeatureModel(Constants.sGanttP13nSettings);
					oSettings = oFeatureModel.getProperty("/", "oSettings");
				}

				this.oUIModel.setGanttSettings(oSettings);
				if (oSettings.enableNowLine !== undefined || oSettings.enableCursorLine !== undefined || oSettings.enableVerticalLine !== undefined) {
					this.controllers.ganttContainer.applySettings(oSettings);
				}
			},

			// before cleanup: SchedulingBoard.persistSettingsP13n
			save: function () {
				var oSettings = this.oUIModel.getP13NSettings();
				var oContainerSettings = this.controllers.ganttContainer.getSettings();
				Object.assign(oSettings, oContainerSettings);
				var oContainer = AppPersContainer.getInstance();
				oContainer.getFeatureModel(Constants.sGanttP13nSettings).setProperty("/", oSettings);
				oContainer.saveContainer();
			}
		});
	}
);
