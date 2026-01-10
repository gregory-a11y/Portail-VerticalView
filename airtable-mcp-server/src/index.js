#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import Airtable from 'airtable';

// Configuration from environment variables
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || "YOUR_AIRTABLE_API_KEY";
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "YOUR_AIRTABLE_BASE_ID";

// Initialize Airtable
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// Create MCP server
const server = new Server(
  {
    name: "airtable-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to format records
function formatRecord(record) {
  return {
    id: record.id,
    fields: record.fields,
    createdTime: record._rawJson.createdTime
  };
}

// Tool: List tables
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "airtable_list_records",
        description: "List records from an Airtable table with optional filtering and sorting",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "The name or ID of the table (e.g., 'Clients', 'tblvndxiZaqAVGP5O', 'Vidéos', 'Contrats', 'Équipe')",
            },
            filterByFormula: {
              type: "string",
              description: "Airtable formula to filter records (optional)",
            },
            maxRecords: {
              type: "number",
              description: "Maximum number of records to return (default: 100)",
            },
            sort: {
              type: "array",
              description: "Array of sort objects with field and direction",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  direction: { type: "string", enum: ["asc", "desc"] }
                }
              }
            },
            view: {
              type: "string",
              description: "Name of a view to use (optional)",
            }
          },
          required: ["table"],
        },
      },
      {
        name: "airtable_get_record",
        description: "Get a single record by its ID from an Airtable table",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "The name or ID of the table",
            },
            recordId: {
              type: "string",
              description: "The record ID (starts with 'rec')",
            },
          },
          required: ["table", "recordId"],
        },
      },
      {
        name: "airtable_create_record",
        description: "Create a new record in an Airtable table",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "The name or ID of the table",
            },
            fields: {
              type: "object",
              description: "The fields to set for the new record",
            },
          },
          required: ["table", "fields"],
        },
      },
      {
        name: "airtable_update_record",
        description: "Update an existing record in an Airtable table",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "The name or ID of the table",
            },
            recordId: {
              type: "string",
              description: "The record ID to update",
            },
            fields: {
              type: "object",
              description: "The fields to update",
            },
          },
          required: ["table", "recordId", "fields"],
        },
      },
      {
        name: "airtable_delete_record",
        description: "Delete a record from an Airtable table",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "The name or ID of the table",
            },
            recordId: {
              type: "string",
              description: "The record ID to delete",
            },
          },
          required: ["table", "recordId"],
        },
      },
      {
        name: "airtable_get_client_dashboard",
        description: "Get all data for a client dashboard (client info, videos, contracts, team members)",
        inputSchema: {
          type: "object",
          properties: {
            clientRecordId: {
              type: "string",
              description: "The client record ID or email",
            },
            useEmail: {
              type: "boolean",
              description: "Set to true if providing an email instead of record ID",
            }
          },
          required: ["clientRecordId"],
        },
      },
    ],
  };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "airtable_list_records": {
        const { table, filterByFormula, maxRecords, sort, view } = args;
        
        const options = {};
        if (filterByFormula) options.filterByFormula = filterByFormula;
        if (maxRecords) options.maxRecords = maxRecords;
        if (sort) options.sort = sort;
        if (view) options.view = view;

        const records = [];
        await base(table)
          .select(options)
          .eachPage((pageRecords, fetchNextPage) => {
            pageRecords.forEach((record) => {
              records.push(formatRecord(record));
            });
            fetchNextPage();
          });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ 
                count: records.length,
                records: records 
              }, null, 2),
            },
          ],
        };
      }

      case "airtable_get_record": {
        const { table, recordId } = args;
        const record = await base(table).find(recordId);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formatRecord(record), null, 2),
            },
          ],
        };
      }

      case "airtable_create_record": {
        const { table, fields } = args;
        const record = await base(table).create(fields);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                record: formatRecord(record)
              }, null, 2),
            },
          ],
        };
      }

      case "airtable_update_record": {
        const { table, recordId, fields } = args;
        const record = await base(table).update(recordId, fields);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                record: formatRecord(record)
              }, null, 2),
            },
          ],
        };
      }

      case "airtable_delete_record": {
        const { table, recordId } = args;
        await base(table).destroy(recordId);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Record ${recordId} deleted successfully`
              }, null, 2),
            },
          ],
        };
      }

      case "airtable_get_client_dashboard": {
        const { clientRecordId, useEmail } = args;
        const result = {
          client: null,
          videos: [],
          contracts: [],
          teamMembers: []
        };

        // Get client
        let clientRecord;
        if (useEmail) {
          const clients = [];
          await base('tblvndxiZaqAVGP5O')
            .select({ filterByFormula: `{Email contact principal}='${clientRecordId}'` })
            .eachPage((records, fetchNextPage) => {
              records.forEach(r => clients.push(r));
              fetchNextPage();
            });
          clientRecord = clients[0];
        } else {
          clientRecord = await base('tblvndxiZaqAVGP5O').find(clientRecordId);
        }

        if (clientRecord) {
          result.client = formatRecord(clientRecord);
          const companyName = clientRecord.fields['Nom du client'] || '';
          const safeCompanyName = companyName.replace(/'/g, "\\'");

          // Get videos
          await base('Vidéos')
            .select({ filterByFormula: `FIND('${safeCompanyName}', {Client (from Sessions de tournage)}) > 0` })
            .eachPage((records, fetchNextPage) => {
              records.forEach(r => result.videos.push(formatRecord(r)));
              fetchNextPage();
            });

          // Get contracts
          await base('Contrats')
            .select({ filterByFormula: `FIND('${safeCompanyName}', {Clients}) > 0` })
            .eachPage((records, fetchNextPage) => {
              records.forEach(r => result.contracts.push(formatRecord(r)));
              fetchNextPage();
            });

          // Get team members
          await base('Équipe')
            .select({ filterByFormula: "FIND('Communication Clients', {Rôles}) > 0" })
            .eachPage((records, fetchNextPage) => {
              records.forEach(r => result.teamMembers.push(formatRecord(r)));
              fetchNextPage();
            });
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: error.message,
            stack: error.stack
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Airtable MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
