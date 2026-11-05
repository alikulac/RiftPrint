/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * This is an extension to Standard Row Settings.
 * Standard shapes available are shapes1, shapes2.....shapes5, this will help to create new custom shapes in addition to existing shapes
 * We can influence the positioning of the shapes in case of overlap, using sapGanttOrder in combination with the order these aggregations are defined in XML
 * @name rsh.eam.ordergantts1.customControl.CustomRowSettings
 */
sap.ui.define(["sap/gantt/simple/GanttRowSettings"], function (GanttRowSettings) {
	"use strict";

	var CustomRowSettings = GanttRowSettings.extend("rsh.eam.ordergantts1.customControl.CustomRowSettings", {
		metadata: {
			aggregations: {
				customShapes6: {
					type: "sap.gantt.simple.BaseShape",
					multiple: true,
					singularName: "Shape",
					sapGanttOrder: 0
				},
				customShapes7: {
					type: "sap.gantt.simple.BaseShape",
					multiple: true,
					singularName: "Shape7",
					sapGanttOrder: 1
				}
			}
		}
	});

	return CustomRowSettings;
});
