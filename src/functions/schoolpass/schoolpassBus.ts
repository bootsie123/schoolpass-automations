import * as df from "durable-functions";

import { SchoolPassAPI, SchoolPassBus } from "../../lib/SchoolPass";
import { Logger, Severity } from "../../lib/Logger";
import { InvocationContext } from "@azure/functions";

export const FUNCTION_NAME = "schoolpassBus";

/**
 * Retrieves information about all of the buses within a SchoolPass environment
 * @param context The invocation context for the function
 * @returns An array of {@link SchoolPassBus} objects
 */
export async function schoolpassBus(context: InvocationContext): Promise<SchoolPassBus[]> {
  const logger = new Logger(context, FUNCTION_NAME);

  const schoolpass = new SchoolPassAPI({ loggingStream: context });

  try {
    await schoolpass.init();

    const buses = await schoolpass.bus();

    return buses;
  } catch (err) {
    logger.log(Severity.Error, err);

    throw err;
  }
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: schoolpassBus
});
