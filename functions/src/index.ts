import * as functions from "firebase-functions";
import { IsNotEmpty, Min, validateOrReject } from "class-validator";
import { RequestHelper } from "./request-helper";
import { BigQuery } from "@google-cloud/bigquery";

export class Progress {
  @IsNotEmpty() project: string;
  @IsNotEmpty() progress: number;
  @Min(1) timestamp: number;

  constructor(
      progress: Progress = {
          project: "",
          progress: 0,
          timestamp: 0,
      }) {
      this.project = progress.project;
      this.progress = progress.progress;
      this.timestamp = progress.timestamp;
  }
}

export const reportProgress = functions.https.onRequest(
    async (request, response) => {
        RequestHelper.logRequestDetails(request);
        if (RequestHelper.isPostMethod(request)) {
            try {
                const progress = await parseAndValidateRequest(request);
                await saveProgressToDatabase(progress);
                response.status(200).send(request.body);
            } catch (error) {
                RequestHelper.respondWithError(response, 400, error);
            }
        } else {
            RequestHelper.respondWithError(response, 403, "Forbidden!");
        }
    });

async function parseAndValidateRequest(request: functions.https.Request) {
    const progress = new Progress(request.body);
    await validateOrReject(progress, { validationError: { target: false } });
    return progress;
}

async function saveProgressToDatabase(progress: Progress) {
    const bq = new BigQuery();
    const datasetName = "reporting_dataset";
    const tableName = "datapoints";
    const dataset = bq.dataset(datasetName);
    const table = dataset.table(tableName);

    // DB Schema
    // project STRING REQUIRED
    // timestamp INTEGER REQUIRED
    // progress FLOAT REQUIRED

    const tableSchema = [
        { name: "project", type: "STRING", mode: "REQUIRED" },
        { name: "timestamp", type: "INTEGER", mode: "REQUIRED" },
        { name: "progress", type: "FLOAT", mode: "REQUIRED" },
    ];

    const datasetExists = await dataset.exists();
    if (!datasetExists[0]) {
        await dataset.create();
    }

    const tableExists = await table.exists();
    if (!tableExists[0]) {
        const options = { schema: tableSchema };
        await table.create(options);
    }

    const row = {
        project: progress.project,
        progress: progress.progress,
        timestamp: progress.timestamp,
    };

    await table.insert(row);
}
