import * as df from "durable-functions";
import { InvocationContext } from "@azure/functions";
import * as nodemailer from "nodemailer";
import * as pug from "pug";
import * as mjml2html from "mjml";

import { Logger, Severity } from "../lib/Logger";
import environment from "../environment";

export const FUNCTION_NAME = "smtpSend";

const transporter = nodemailer.createTransport({
  host: environment.smtp.host,
  port: environment.smtp.port,
  secure: environment.smtp.useTLS,
  auth: {
    user: environment.smtp.auth.username,
    pass: environment.smtp.auth.password
  }
});

export interface SMTPSendParams {
  template: string;
  subject: string;
  to: string;
  body: any;
}

/**
 * Sends an email via SMTP using the given template and options
 * @param params The {@link SMTPSendParams} object to use for sending the email
 * @param context The OrchestrationContext passed to the handler
 * @returns Info on the sent email if successful, otherwise an error is thrown
 */
export async function smtpSend(params: SMTPSendParams, context: InvocationContext) {
  const logger = new Logger(context, "SMTP");

  try {
    await transporter.verify();

    const template = pug.compileFile(__dirname + `/../templates/${params.template}.pug`);

    const mjml = mjml2html(template(params.body));

    const success = await transporter.sendMail({
      from: environment.smtp.sendAsEmail,
      to: params.to,
      subject: params.subject,
      html: mjml.html
    });

    return success;
  } catch (err) {
    logger.log(Severity.Error, err, "\nInput Parameters:", params);

    throw err;
  }
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: smtpSend
});
