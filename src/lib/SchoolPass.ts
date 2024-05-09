import axios, { AxiosError, AxiosInstance } from "axios";
import * as crypto from "crypto-js";

import environment from "../environment";

import { Logger, LoggingStream, Severity } from "./Logger";

/**
 * Additional options for the {@link SchoolPassAPI}
 */
export interface SchoolPassAPIOptions {
  /** Stream to use when logging */
  loggingStream?: LoggingStream;
}

/**
 * Outlines the possible options for the api/Reports/BusBoardingManifestReport endpoint
 */
export interface SchoolPassBusBoardingManifestReportOptions {
  sites?: string;
  busType?: string;
  fromDate: string;
  toDate: string;
  reportGrouping?: string;
  buses?: string;
  grades?: string;
  busPasses?: string;
  sortOrder?: string;
  reportType: number;
}

/**
 * Outlines info on a SchoolPass user
 */
export interface SchoolPassUserInfo {
  login?: string;
  userType?: string;
  schoolConnection?: {
    appCode?: number;
    schoolUrl?: string;
    apiUrl?: string;
    schoolName?: string;
    connectionString?: string;
    emergencyManagementApiUrl?: string;
    distrctId?: any;
  };
}

/**
 * Outlines a SchoolPass user
 */
export interface SchoolPassUser {
  internalId?: number;
  userType?: number;
}

/**
 * Outlines a SchoolPass bus
 */
export interface SchoolPassBus {
  busBoarding?: {
    id?: number;
    busId?: number;
    date?: Date;
    status?: any;
    statusBoardingDatetime?: any;
    statusBoardingUserId?: any;
    statusDepartedDatetime?: any;
    statusDepartedUserId?: any;
    busTypeId?: number;
  };
  id?: number;
  number?: string;
  driver?: string;
  destination?: string;
  pickupOrder?: string;
  btag?: string;
  btag2?: string;
  capacity?: number;
  departure?: boolean;
  sitePrefix?: string;
}

/**
 * Outlines an item in a "Bus Boarding Manifest" report
 */
export interface SchoolPassBusBoardingManifestReportItem {
  sitePrefix?: string;
  siteName?: string;
  busRoute?: string;
  firstName?: string;
  lastName?: string;
  gradeName?: string;
  boardingDate?: Date;
  dismissalLocationName?: string;
  busStopName?: string;
  studentTypeDefault?: string;
  busPassName?: any;
  boardedTime?: any;
  changeSeries?: string;
  notes?: string;
  modifiedBy?: string;
  modifiedDate?: Date;
  externalID?: string;
}

/**
 * Responsible for handling all communication with the SchoolPass API
 */
export class SchoolPassAPI {
  /** The main logging instance */
  private logger: Logger;

  /** The {@link AxiosInstance} to use for all HTTP requests */
  private http: AxiosInstance;

  /** Used for all HTTP requests to SchoolPass homebase */
  private homebaseHttp: AxiosInstance;

  private schoolCode: number;
  private user: SchoolPassUser;

  /**
   * Creates a new instance of the {@link SchoolPassAPI} using the specified options
   * @param options Additional options for the {@link SchoolPassAPI} to use
   */
  constructor(options: SchoolPassAPIOptions = { loggingStream: console }) {
    this.logger = new Logger(options.loggingStream, "SchoolPassAPI");

    this.initAxiosInstance();
  }

  /**
   * Initalizes the Axios instance used for making HTTP requests to the SchoolPass API
   */
  private initAxiosInstance() {
    const http = axios.create();

    // Handles automatic refreshing of expired access tokens
    http.interceptors.response.use(
      res => {
        return res;
      },
      async err => {
        const originalReq = err.config;

        if (err.response.status === 401 && !originalReq._retry) {
          originalReq._retry = true;

          this.logger.log(Severity.Debug, err.response.data);

          this.logger.log(
            Severity.Warning,
            "Authentication token possibly expired. Auto refreshing token..."
          );

          try {
            const token = await this.authenticate(
              this.schoolCode,
              this.user.userType,
              this.user.internalId,
              environment.schoolPass.password
            );

            originalReq.headers.Token = token;

            return http(originalReq);
          } catch {
            this.logger.log(Severity.Error, "Unable to auto refresh authentication token");
          }
        } else if (err.response.status === 429) {
          const retryAfter = parseInt(err.response.headers["retry-after"]) + 3;

          this.logger.log(
            Severity.Warning,
            `Rate limit reached. Retrying after ${retryAfter} seconds`
          );

          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

          return http(originalReq);
        }

        throw err;
      }
    );

    this.http = http;
    this.homebaseHttp = axios.create();
  }

  /**
   * Initializes the auth token used by the SchoolPass API
   */
  public async init() {
    try {
      const res = await this.http.get(environment.schoolPass.configURL);

      const data = res.data;

      this.homebaseHttp.defaults.baseURL = data.defaultHomeBaseUrl;
      this.homebaseHttp.defaults.headers.common.Authorization = `Bearer ${data.authToken}`;

      const connectionInfo = (await this.findUserInfo(environment.schoolPass.username))[0];

      this.schoolCode = connectionInfo.schoolConnection.appCode;

      this.http.defaults.baseURL = connectionInfo.schoolConnection.apiUrl + "/api";
      this.http.defaults.headers.common.Authorization = `Bearer ${data.authToken}`;
      this.http.defaults.headers.common.Appcode = this.schoolCode;

      // No longer needed in newer version of School Pass
      // const hash = this.hashPassword(environment.schoolPass.password);

      const userInfo = (
        await this.getAuthenticatingUser(
          connectionInfo.schoolConnection.appCode,
          environment.schoolPass.username,
          environment.schoolPass.password
        )
      )[0];

      this.user = userInfo;

      const token = await this.authenticate(
        this.schoolCode,
        userInfo.userType,
        userInfo.internalId,
        hash
      );

      this.http.defaults.headers.common.Authorization = `Bearer ${token}`;
    } catch (err) {
      this.logger.log(Severity.Error, err);

      throw new Error(
        "[SchoolPassAPI] Error occurred while trying to initialize the SchoolPass API"
      );
    }
  }

  /**
   * Handles errors from SchoolPass API requests and parses the HTTP response
   * to create an error message
   * @param error An {@link AxiosError} recieved from a failed Axios request
   * @returns A comma seperated list of error messages
   */
  private apiErrorHandler(error: AxiosError): string {
    const message = error?.message || error?.toString();

    this.logger.forceLog(Severity.Debug, message, error.response);

    console.log(message, error.response);

    if (error?.response?.data) {
      return error.response.data.toString();
    }

    return message;
  }

  /**
   * Hashes the given password according to SchoolPass implemented algorithm
   * @param password The password to hash
   * @returns A hashed password
   */
  hashPassword(password: string) {
    // eslint-disable-next-line new-cap
    return crypto.SHA1(password).toString(crypto.enc.Base64);
  }

  /**
   * Authenticates a user within a school's SchoolPass environment
   * @param schoolCode The school code of the user's environment
   * @param userType The type code of the user
   * @param userId The user ID of the user
   * @param password The password of the user
   * @returns The authentication token
   */
  async authenticate(
    schoolCode: number,
    userType: number,
    userId: number,
    password: string
  ): Promise<string> {
    try {
      const res = await this.http.post(
        "Auth/token",
        {
          schoolCode,
          userType,
          userId,
          password
        }
      );

      return res.data;
    } catch (err) {
      this.logger.log(Severity.Error, "Error authenticating user:", err);

      throw err;
    }
  }

  /**
   * Gets info about an authenticating SchoolPass user
   * @param schoolCode The school code of the user's environment
   * @param username The username of the user
   * @param password The password of the user
   * @returns The authentication token
   */
  async getAuthenticatingUser(
    schoolCode: number,
    username: string,
    password: string
  ): Promise<SchoolPassUser[]> {
    try {
      const res = await this.http.get("User", {
        params: {
          schoolCode,
          login: username,
          password
        }
      });

      return res.data;
    } catch (err) {
      this.logger.log(Severity.Error, "Error fetch info about authenticating user:", err);

      throw err;
    }
  }

  /**
   * Retrieves info about a SchoolPass user
   * @param email The email address of the user
   * @returns A {@link SchoolPassUserInfo} object
   */
  async findUserInfo(email: string): Promise<SchoolPassUserInfo[]> {
    try {
      const res = await this.homebaseHttp.get("findspruserinfo", {
        params: {
          emailAddress: email
        }
      });

      return res.data;
    } catch (err) {
      this.logger.log(Severity.Error, "Error fetching user info:", err);

      throw err;
    }
  }

  /**
   * Retrieves information on all buses
   * @returns An array of {@link SchoolPassBus} objects
   */
  async bus(): Promise<SchoolPassBus[]> {
    try {
      const res = await this.http.get("Bus");

      return res.data;
    } catch (err) {
      throw this.apiErrorHandler(err);
    }
  }

  async busBoardingManifestReport(
    options: SchoolPassBusBoardingManifestReportOptions
  ): Promise<SchoolPassBusBoardingManifestReportItem[]> {
    try {
      const res = await this.http.post("v2/Reports/BusBoardingManifestReport", options);

      return res.data;
    } catch (err) {
      throw this.apiErrorHandler(err);
    }
  }
}
