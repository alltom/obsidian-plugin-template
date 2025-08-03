#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");

const TODO_DIR = process.cwd();
const TODO_FILE_PATH = path.join(TODO_DIR, "todo.json");

const TOOL_DEFINITIONS = [
  {
    name: "ListTasks",
    description:
      "Lists all tasks in Markdown format. This is the primary way to get the current state of the to-do list, including task text, index, completion status, and the currently active task.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "SetTasks",
    description:
      "Replaces the entire task list with a new set of tasks and returns the updated list. This is useful for initialization or bulk replacement. All new tasks will be marked as incomplete, and the active task will be reset.",
    parameters: {
      type: "OBJECT",
      properties: {
        tasks_text: {
          type: "STRING",
          description:
            "Required. A string where each line represents the text of a new, incomplete task. Example: 'Buy milk\nWalk the dog. Do not include Markdown bullet or checkbox syntax; just the tasks, one per line.'",
        },
      },
      required: ["tasks_text"],
    },
  },
  {
    name: "UpdateTaskStates",
    description:
      "Atomically updates the completion status of specified tasks and/or sets a new active task, then returns the updated list. This is the main tool for modifying tasks.",
    parameters: {
      type: "OBJECT",
      required: ["status_updates", "active_task_id"],
      properties: {
        status_updates: {
          type: "ARRAY",
          description:
            "Optional. A list of objects, each specifying a task to update and its new completion status.",
          items: {
            type: "OBJECT",
            properties: {
              id: {
                type: "OBJECT",
                properties: {
                  index: {
                    type: "NUMBER",
                    description: "Required. The 0-based index of the task in the list.",
                  },
                  text_prefix: {
                    type: "STRING",
                    description:
                      "Required. A prefix of the task's text for verification. Example: 'Buy milk' would be valid for the task 'Buy milk from the store'",
                  },
                },
                required: ["index", "text_prefix"],
              },
              is_complete: { type: "BOOLEAN" },
            },
            required: ["id", "is_complete"],
          },
        },
        active_task_id: {
          description:
            "Optional. The ID of the task to set as active. The task must be incomplete. Use `null` to set no task as active.",
          type: "OBJECT",
          properties: {
            index: {
              type: "NUMBER",
              description: "Required. The 0-based index of the task in the list.",
            },
            text_prefix: {
              type: "STRING",
              description:
                "Required. A prefix of the task's text for verification. Example: 'Buy milk' would be valid for the task 'Buy milk from the store'",
            },
          },
          required: ["index", "text_prefix"],
        },
      },
    },
  },
];

async function getTodoState() {
  try {
    await fs.mkdir(TODO_DIR, { recursive: true });
    const content = await fs.readFile(TODO_FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      return { tasks: [], active_task_index: null };
    }
    throw error;
  }
}

async function setTodoState(state) {
  await fs.mkdir(TODO_DIR, { recursive: true });
  await fs.writeFile(TODO_FILE_PATH, JSON.stringify(state, null, 2));
}

function formatTasksAsMarkdown(state) {
  if (state.tasks.length === 0) {
    return "There are no tasks.";
  }

  let output = "Tasks:\n\n";
  state.tasks.forEach((task, index) => {
    const checkbox = task.is_complete ? "[x]" : "[ ]";
    output += `${index + 1}. ${checkbox} ${task.text}\n`;
  });

  if (state.active_task_index !== null) {
    const activeTask = state.tasks[state.active_task_index];
    if (activeTask) {
      output += `\nThe active task is: "${state.active_task_index + 1}. ${activeTask.text}"`;
    } else {
      output += `\nThere is no active task.`;
    }
  } else {
    output += `\nThere is no active task.`;
  }
  return output;
}

function verifyTaskID(task, id) {
  if (!task) {
    throw new Error(`Task with index ${id.index} not found.`);
  }
  if (!task.text.startsWith(id.text_prefix)) {
    throw new Error(
      `Task text for index ${id.index} does not match prefix "${id.text_prefix}". Expected: "${task.text}"`,
    );
  }
}

async function listTasks() {
  const state = await getTodoState();
  console.log(formatTasksAsMarkdown(state));
}

async function setTasks(params) {
  const tasksText = params.tasks_text || "";
  const tasks = tasksText
    .split("\n")
    .filter((t) => t.trim() !== "")
    .map((text) => ({
      text,
      is_complete: false,
    }));
  const newState = {
    tasks,
    active_task_index: null,
  };
  await setTodoState(newState);
  console.log(formatTasksAsMarkdown(newState));
}

async function updateTasks(params) {
  const state = await getTodoState();
  const { status_updates, active_task_id } = params;

  if (status_updates) {
    for (const update of status_updates) {
      const { id, is_complete } = update;
      const task = state.tasks[id.index];
      verifyTaskID(task, id);
      task.is_complete = is_complete;

      if (id.index === state.active_task_index && is_complete) {
        state.active_task_index = null;
      }
    }
  }

  if (active_task_id) {
    const task = state.tasks[active_task_id.index];
    verifyTaskID(task, active_task_id);
    if (task.is_complete) {
      throw new Error(`Cannot set a complete task as active (index: ${active_task_id.index}).`);
    }
    state.active_task_index = active_task_id.index;
  } else if (params.hasOwnProperty("active_task_id") && active_task_id === null) {
    state.active_task_index = null;
  }

  await setTodoState(state);
  console.log(formatTasksAsMarkdown(state));
}

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(JSON.parse(data || "{}"));
    });
  });
}

async function main() {
  // Discovery mode is invoked as `node todo-tool.cjs discover`
  if (process.argv[2] === "discover") {
    console.log(JSON.stringify(TOOL_DEFINITIONS, null, 2));
    return;
  }

  // Call mode is invoked as `todo-tool.cjs <ToolName>` with params on stdin
  const toolName = process.argv[2];
  const toolParams = await readStdin();

  switch (toolName) {
    case "ListTasks":
      await listTasks();
      break;
    case "SetTasks":
      await setTasks(toolParams);
      break;
    case "UpdateTaskStates":
      await updateTasks(toolParams);
      break;
    default:
      console.error(`Unknown tool: ${toolName}. The first argument should be the tool name.`);
      process.exit(1);
  }
}

main().catch((error) => {
  console.error("Tool execution failed:", error.message);
  process.exit(1);
});
