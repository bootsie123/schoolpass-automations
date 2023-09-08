export default {
  production: process.env.APPSETTING_FUNCTIONS_WORKER_RUNTIME
    ? true
    : process.env.NODE_ENV === "production",
  schoolPass: {
    configURL: "https://schoolpass.cloud/assets/runtime.config.json",
    schoolName: process.env.SCHOOLPASS_SCHOOL_NAME || "SchoolPass Automations",
    username: process.env.SCHOOLPASS_USERNAME,
    password: process.env.SCHOOLPASS_PASSWORD
  },
  automations: {
    busManifestReport: {
      enabled: process.env.AUTOMATIONS_BUS_MANIFEST_REPORT_ENABLED === "true",
      toEmail: process.env.AUTOMATIONS_BUS_MANIFEST_REPORT_TO_EMAIL,
      schedule: process.env.AUTOMATIONS_BUS_MANIFEST_REPORT_SCHEDULE,
      busTags: process.env.AUTOMATIONS_BUS_MANIFEST_REPORT_BUS_TAGS || ""
    }
  },
  smtp: {
    sendAsEmail: process.env.SMTP_SEND_AS_EMAIL,
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    useTLS: process.env.SMTP_USE_TLS === "true",
    auth: {
      username: process.env.SMTP_USERNAME,
      password: process.env.SMTP_PASSWORD
    }
  }
};
