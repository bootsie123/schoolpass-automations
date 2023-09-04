import * as df from "durable-functions";

import {
  SchoolPassAPI,
  SchoolPassBusBoardingManifestReportItem,
  SchoolPassBusBoardingManifestReportOptions
} from "../../lib/SchoolPass";
import { Logger, Severity } from "../../lib/Logger";
import { InvocationContext } from "@azure/functions";

export const FUNCTION_NAME = "schoolpassBusBoardingManifestReport";

/**
 * Runs a "Bus Boarding Manifest" report using the specified options
 * @param params A {@link SchoolPassBusBoardingManifestReportParams} object containing the report options
 * @param context The invocation context for the function
 * @returns An array of {@link SchoolPassBusBoardingManifestReportItem} objects
 */
export async function SchoolPassBusBoardingManifestReport(
  params: SchoolPassBusBoardingManifestReportOptions,
  context: InvocationContext
): Promise<SchoolPassBusBoardingManifestReportItem[]> {
  const logger = new Logger(context, FUNCTION_NAME);

  const schoolpass = new SchoolPassAPI({ loggingStream: context });

  try {
    await schoolpass.init();

    const buses = await schoolpass.busBoardingManifestReport(params);

    return buses;
  } catch (err) {
    logger.log(Severity.Error, err, "\nInput Parameters:", params);

    throw err;
  }
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: SchoolPassBusBoardingManifestReport
});
