"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
  getRectOfNodes,
  getTransformForBounds,
} from "reactflow";
import { toPng, toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import "reactflow/dist/style.css";
import {
  Play,
  Plus,
  Save,
  Upload,
  X,
  Trash2,
  CheckCircle,
  Circle,
  AlertCircle,
  Moon,
  Sun,
  Download,
  FileJson,
} from "lucide-react";

// Loading Screen Component
const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-8 border-white/30"></div>
          <div className="absolute inset-0 rounded-full border-8 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <div className="absolute inset-4 rounded-full border-8 border-white/20"></div>
          <div
            className="absolute inset-4 rounded-full border-8 border-t-transparent border-r-white border-b-transparent border-l-transparent animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1s" }}
          ></div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2 animate-pulse">
          HR Workflow Designer
        </h2>
        <p className="text-white/80 text-lg">Loading your workspace...</p>
      </div>
    </div>
  );
};

// Mock API Layer
const mockAPI = {
  getAutomations: async () => {
    return [
      {
        id: "send_email",
        label: "Send Email",
        params: ["to", "subject", "body"],
      },
      {
        id: "generate_doc",
        label: "Generate Document",
        params: ["template", "recipient"],
      },
      {
        id: "notify_slack",
        label: "Slack Notification",
        params: ["channel", "message"],
      },
      {
        id: "create_ticket",
        label: "Create Ticket",
        params: ["title", "priority"],
      },
    ];
  },

  simulate: async (workflow) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const steps = [];
    const visited = new Set();

    const traverse = (nodeId, depth = 0) => {
      if (!nodeId || visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = workflow.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      steps.push({
        nodeId: node.id,
        type: node.type,
        label: node.data.label,
        status: "completed",
        timestamp: new Date().toISOString(),
        details: getNodeDetails(node),
      });

      const outgoingEdges = workflow.edges.filter((e) => e.source === nodeId);
      outgoingEdges.forEach((edge) => traverse(edge.target, depth + 1));
    };

    const startNode = workflow.nodes.find((n) => n.type === "startNode");
    if (startNode) traverse(startNode.id);

    return { steps, status: "success" };
  },
};

const getNodeDetails = (node) => {
  switch (node.type) {
    case "taskNode":
      return `Assigned to: ${node.data.assignee || "Unassigned"}`;
    case "approvalNode":
      return `Approver: ${node.data.approver || "Not set"}`;
    case "automatedNode":
      return `Action: ${node.data.action || "None"}`;
    default:
      return "";
  }
};

// Custom Node Components with Handles
const NodeWrapper = ({ children, selected, type, isDark }) => {
  const colors = {
    startNode: isDark
      ? "from-emerald-600 to-teal-600"
      : "from-emerald-400 to-teal-400",
    taskNode: isDark
      ? "from-blue-600 to-indigo-600"
      : "from-blue-400 to-indigo-400",
    approvalNode: isDark
      ? "from-amber-600 to-orange-600"
      : "from-amber-400 to-orange-400",
    automatedNode: isDark
      ? "from-purple-600 to-pink-600"
      : "from-purple-400 to-pink-400",
    endNode: isDark ? "from-rose-600 to-red-600" : "from-rose-400 to-red-400",
  };

  return (
    <div
      className={`relative px-5 py-4 rounded-xl shadow-xl bg-gradient-to-br ${
        colors[type]
      } 
      ${
        selected
          ? "ring-4 ring-offset-2 ring-indigo-500"
          : "ring-2 ring-white/20"
      } 
      min-w-[200px] transition-all hover:scale-105 hover:shadow-2xl`}
    >
      {children}
    </div>
  );
};

const StartNode = ({ data, selected, isDark }) => (
  <NodeWrapper selected={selected} type="startNode" isDark={isDark}>
    <Handle
      type="target"
      position={Position.Top}
      className="w-3 h-3 bg-white border-2 border-emerald-500"
    />
    <Handle
      type="target"
      position={Position.Left}
      className="w-3 h-3 bg-white border-2 border-emerald-500"
    />
    <Handle
      type="target"
      position={Position.Right}
      className="w-3 h-3 bg-white border-2 border-emerald-500"
    />
    <div className="text-white">
      <div className="font-bold text-sm mb-1 uppercase tracking-wide">
        Start
      </div>
      <div className="text-sm opacity-95 font-medium">
        {data.label || "Workflow Start"}
      </div>
    </div>
    <Handle
      type="source"
      position={Position.Bottom}
      className="w-3 h-3 bg-white border-2 border-emerald-500"
    />
    <Handle
      type="source"
      position={Position.Left}
      className="w-3 h-3 bg-white border-2 border-emerald-500"
    />
    <Handle
      type="source"
      position={Position.Right}
      className="w-3 h-3 bg-white border-2 border-emerald-500"
    />
  </NodeWrapper>
);

const TaskNode = ({ data, selected, isDark }) => (
  <NodeWrapper selected={selected} type="taskNode" isDark={isDark}>
    <Handle
      type="target"
      position={Position.Top}
      className="w-3 h-3 bg-white border-2 border-blue-500"
    />
    <Handle
      type="target"
      position={Position.Left}
      className="w-3 h-3 bg-white border-2 border-blue-500"
    />
    <Handle
      type="target"
      position={Position.Right}
      className="w-3 h-3 bg-white border-2 border-blue-500"
    />
    <div className="text-white">
      <div className="font-bold text-sm mb-1 uppercase tracking-wide">Task</div>
      <div className="text-sm opacity-95 font-medium">
        {data.label || "New Task"}
      </div>
      {data.assignee && (
        <div className="text-xs mt-2 opacity-80 bg-white/20 rounded px-2 py-1 inline-block">
          → {data.assignee}
        </div>
      )}
    </div>
    <Handle
      type="source"
      position={Position.Bottom}
      className="w-3 h-3 bg-white border-2 border-blue-500"
    />
    <Handle
      type="source"
      position={Position.Left}
      className="w-3 h-3 bg-white border-2 border-blue-500"
    />
    <Handle
      type="source"
      position={Position.Right}
      className="w-3 h-3 bg-white border-2 border-blue-500"
    />
  </NodeWrapper>
);

const ApprovalNode = ({ data, selected, isDark }) => (
  <NodeWrapper selected={selected} type="approvalNode" isDark={isDark}>
    <Handle
      type="target"
      position={Position.Top}
      className="w-3 h-3 bg-white border-2 border-amber-500"
    />
    <Handle
      type="target"
      position={Position.Left}
      className="w-3 h-3 bg-white border-2 border-amber-500"
    />
    <Handle
      type="target"
      position={Position.Right}
      className="w-3 h-3 bg-white border-2 border-amber-500"
    />
    <div className="text-white">
      <div className="font-bold text-sm mb-1 uppercase tracking-wide">
        Approval
      </div>
      <div className="text-sm opacity-95 font-medium">
        {data.label || "Needs Approval"}
      </div>
      {data.approver && (
        <div className="text-xs mt-2 opacity-80 bg-white/20 rounded px-2 py-1 inline-block">
          By: {data.approver}
        </div>
      )}
    </div>
    <Handle
      type="source"
      position={Position.Bottom}
      className="w-3 h-3 bg-white border-2 border-amber-500"
    />
    <Handle
      type="source"
      position={Position.Left}
      className="w-3 h-3 bg-white border-2 border-amber-500"
    />
    <Handle
      type="source"
      position={Position.Right}
      className="w-3 h-3 bg-white border-2 border-amber-500"
    />
  </NodeWrapper>
);

const AutomatedNode = ({ data, selected, isDark }) => (
  <NodeWrapper selected={selected} type="automatedNode" isDark={isDark}>
    <Handle
      type="target"
      position={Position.Top}
      className="w-3 h-3 bg-white border-2 border-purple-500"
    />
    <Handle
      type="target"
      position={Position.Left}
      className="w-3 h-3 bg-white border-2 border-purple-500"
    />
    <Handle
      type="target"
      position={Position.Right}
      className="w-3 h-3 bg-white border-2 border-purple-500"
    />
    <div className="text-white">
      <div className="font-bold text-sm mb-1 uppercase tracking-wide">
        Automated
      </div>
      <div className="text-sm opacity-95 font-medium">
        {data.label || "System Action"}
      </div>
      {data.action && (
        <div className="text-xs mt-2 opacity-80 bg-white/20 rounded px-2 py-1 inline-block">
          {data.action}
        </div>
      )}
    </div>
    <Handle
      type="source"
      position={Position.Bottom}
      className="w-3 h-3 bg-white border-2 border-purple-500"
    />
    <Handle
      type="source"
      position={Position.Left}
      className="w-3 h-3 bg-white border-2 border-purple-500"
    />
    <Handle
      type="source"
      position={Position.Right}
      className="w-3 h-3 bg-white border-2 border-purple-500"
    />
  </NodeWrapper>
);

const EndNode = ({ data, selected, isDark }) => (
  <NodeWrapper selected={selected} type="endNode" isDark={isDark}>
    <Handle
      type="target"
      position={Position.Top}
      className="w-3 h-3 bg-white border-2 border-rose-500"
    />
    <Handle
      type="target"
      position={Position.Left}
      className="w-3 h-3 bg-white border-2 border-rose-500"
    />
    <Handle
      type="target"
      position={Position.Right}
      className="w-3 h-3 bg-white border-2 border-rose-500"
    />
    <div className="text-white">
      <div className="font-bold text-sm mb-1 uppercase tracking-wide">End</div>
      <div className="text-sm opacity-95 font-medium">
        {data.label || "Workflow Complete"}
      </div>
    </div>
  </NodeWrapper>
);

// Progress Bar Component
const ProgressBar = ({ label, value, color, isDark }) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-2">
        <span
          className={`text-sm font-semibold ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {label}
        </span>
        <span className={`text-sm font-bold ${color}`}>{value}%</span>
      </div>
      <div
        className={`w-full h-3 rounded-full overflow-hidden ${
          isDark ? "bg-gray-700" : "bg-gray-200"
        }`}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500 ease-out shadow-lg`}
          style={{ width: `${value}%` }}
        >
          <div className="h-full w-full bg-white/20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

// Insights Panel Component
const InsightsPanel = ({ nodes, edges, isDark }) => {
  const totalNodes = nodes.length;
  const automatedNodes = nodes.filter((n) => n.type === "automatedNode").length;
  const approvalNodes = nodes.filter((n) => n.type === "approvalNode").length;
  const taskNodes = nodes.filter((n) => n.type === "taskNode").length;

  const automationCoverage =
    totalNodes > 0 ? Math.round((automatedNodes / totalNodes) * 100) : 0;
  const workflowComplexity =
    totalNodes > 0
      ? Math.min(100, Math.round((edges.length / totalNodes) * 50))
      : 0;
  const approvalRate =
    totalNodes > 0 ? Math.round((approvalNodes / totalNodes) * 100) : 0;
  const taskDistribution =
    totalNodes > 0 ? Math.round((taskNodes / totalNodes) * 100) : 0;

  return (
    <aside
      className={`w-80 ${
        isDark
          ? "bg-gray-800 border-gray-700"
          : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
      } border-l overflow-y-auto transition-colors duration-300 shadow-2xl`}
    >
      <div className="p-6 space-y-6">
        {/* Performance Overview */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <h3
              className={`text-lg font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Performance Overview
            </h3>
          </div>

          <div
            className={`p-4 rounded-xl ${
              isDark
                ? "bg-gray-700/50"
                : "bg-gradient-to-br from-blue-50 to-indigo-50"
            } mb-4`}
          >
            <div className="text-center">
              <div
                className={`text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1`}
              >
                {totalNodes}
              </div>
              <div
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                } font-medium`}
              >
                Total Nodes
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div
              className={`p-3 rounded-lg ${
                isDark
                  ? "bg-purple-900/30 border border-purple-700"
                  : "bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200"
              }`}
            >
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {automatedNodes}
              </div>
              <div
                className={`text-xs ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Automated
              </div>
            </div>
            <div
              className={`p-3 rounded-lg ${
                isDark
                  ? "bg-amber-900/30 border border-amber-700"
                  : "bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200"
              }`}
            >
              <div className="text-2xl font-bold text-amber-600 mb-1">
                {approvalNodes}
              </div>
              <div
                className={`text-xs ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Approvals
              </div>
            </div>
          </div>
        </div>

        {/* Flow Metrics */}
        <div>
          <h4
            className={`text-sm font-bold ${
              isDark ? "text-gray-300" : "text-gray-700"
            } mb-4 uppercase tracking-wider flex items-center gap-2`}
          >
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            Flow Metrics
          </h4>

          <ProgressBar
            label="Automation Coverage"
            value={automationCoverage}
            color="from-purple-500 to-pink-500"
            isDark={isDark}
          />

          <ProgressBar
            label="Workflow Complexity"
            value={workflowComplexity}
            color="from-blue-500 to-cyan-500"
            isDark={isDark}
          />

          <ProgressBar
            label="Approval Distribution"
            value={approvalRate}
            color="from-amber-500 to-orange-500"
            isDark={isDark}
          />

          <ProgressBar
            label="Task Distribution"
            value={taskDistribution}
            color="from-emerald-500 to-teal-500"
            isDark={isDark}
          />
        </div>

        {/* Flow Objectives */}
        <div>
          <h4
            className={`text-sm font-bold ${
              isDark ? "text-gray-300" : "text-gray-700"
            } mb-4 uppercase tracking-wider flex items-center gap-2`}
          >
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            Flow Objectives
          </h4>

          <div className="space-y-3">
            <div
              className={`p-4 rounded-xl ${
                isDark
                  ? "bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-700"
                  : "bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200"
              } hover:scale-105 transition-transform cursor-pointer`}
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    } mb-1`}
                  >
                    Streamline Process
                  </div>
                  <div
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Reduce manual steps by {automationCoverage}%
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-xl ${
                isDark
                  ? "bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-700"
                  : "bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200"
              } hover:scale-105 transition-transform cursor-pointer`}
            >
              <div className="flex items-start gap-3">
                <Play className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    } mb-1`}
                  >
                    Optimize Efficiency
                  </div>
                  <div
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {edges.length} connections established
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-xl ${
                isDark
                  ? "bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700"
                  : "bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200"
              } hover:scale-105 transition-transform cursor-pointer`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    } mb-1`}
                  >
                    Ensure Compliance
                  </div>
                  <div
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {approvalNodes} approval checkpoints
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div
          className={`p-5 rounded-xl ${
            isDark
              ? "bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-700"
              : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200"
          }`}
        >
          <h4
            className={`text-sm font-bold ${
              isDark ? "text-white" : "text-gray-900"
            } mb-3 flex items-center gap-2`}
          >
            💡 Quick Insights
          </h4>
          <ul
            className={`text-xs ${
              isDark ? "text-gray-300" : "text-gray-700"
            } space-y-2`}
          >
            {totalNodes === 0 && (
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">•</span>
                <span>Start by adding nodes from the left panel</span>
              </li>
            )}
            {totalNodes > 0 && automationCoverage < 30 && (
              <li className="flex items-start gap-2">
                <span className="text-purple-500">•</span>
                <span>
                  Consider adding more automated nodes to improve efficiency
                </span>
              </li>
            )}
            {edges.length === 0 && totalNodes > 1 && (
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Connect nodes by dragging from handles</span>
              </li>
            )}
            {totalNodes > 0 && edges.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                <span>Great! Your workflow is taking shape</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
};

// Node Configuration Panel
const NodeConfigPanel = ({ node, onUpdate, onClose, automations, isDark }) => {
  const [formData, setFormData] = useState(node.data);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate(node.id, formData);
    onClose();
  };

  const inputClass = `w-full px-4 py-2.5 border ${
    isDark
      ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
      : "border-gray-300 bg-white text-gray-900"
  } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`;
  const labelClass = `block text-sm font-semibold ${
    isDark ? "text-gray-200" : "text-gray-700"
  } mb-2`;

  const renderFields = () => {
    switch (node.type) {
      case "startNode":
        return (
          <>
            <div>
              <label className={labelClass}>Title</label>
              <input
                type="text"
                value={formData.label || ""}
                onChange={(e) => handleChange("label", e.target.value)}
                className={inputClass}
                placeholder="Workflow start"
              />
            </div>
            <div>
              <label className={labelClass}>Metadata</label>
              <textarea
                value={formData.metadata || ""}
                onChange={(e) => handleChange("metadata", e.target.value)}
                className={inputClass}
                rows="3"
                placeholder="Key-value pairs (optional)"
              />
            </div>
          </>
        );

      case "taskNode":
        return (
          <>
            <div>
              <label className={labelClass}>Title *</label>
              <input
                type="text"
                value={formData.label || ""}
                onChange={(e) => handleChange("label", e.target.value)}
                className={inputClass}
                placeholder="Task name"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className={inputClass}
                rows="3"
                placeholder="Task description"
              />
            </div>
            <div>
              <label className={labelClass}>Assignee</label>
              <input
                type="text"
                value={formData.assignee || ""}
                onChange={(e) => handleChange("assignee", e.target.value)}
                className={inputClass}
                placeholder="Employee name or role"
              />
            </div>
            <div>
              <label className={labelClass}>Due Date</label>
              <input
                type="date"
                value={formData.dueDate || ""}
                onChange={(e) => handleChange("dueDate", e.target.value)}
                className={inputClass}
              />
            </div>
          </>
        );

      case "approvalNode":
        return (
          <>
            <div>
              <label className={labelClass}>Title</label>
              <input
                type="text"
                value={formData.label || ""}
                onChange={(e) => handleChange("label", e.target.value)}
                className={inputClass}
                placeholder="Approval step"
              />
            </div>
            <div>
              <label className={labelClass}>Approver Role</label>
              <select
                value={formData.approver || ""}
                onChange={(e) => handleChange("approver", e.target.value)}
                className={inputClass}
              >
                <option value="">Select approver</option>
                <option value="Manager">Manager</option>
                <option value="HRBP">HRBP</option>
                <option value="Director">Director</option>
                <option value="VP">VP</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Auto-approve Threshold</label>
              <input
                type="number"
                value={formData.threshold || ""}
                onChange={(e) => handleChange("threshold", e.target.value)}
                className={inputClass}
                placeholder="Amount or days"
              />
            </div>
          </>
        );

      case "automatedNode":
        return (
          <>
            <div>
              <label className={labelClass}>Title</label>
              <input
                type="text"
                value={formData.label || ""}
                onChange={(e) => handleChange("label", e.target.value)}
                className={inputClass}
                placeholder="Automation name"
              />
            </div>
            <div>
              <label className={labelClass}>Action</label>
              <select
                value={formData.actionId || ""}
                onChange={(e) => {
                  const selected = automations.find(
                    (a) => a.id === e.target.value
                  );
                  handleChange("actionId", e.target.value);
                  handleChange("action", selected?.label || "");
                  handleChange("params", selected?.params || []);
                }}
                className={inputClass}
              >
                <option value="">Select action</option>
                {automations.map((auto) => (
                  <option key={auto.id} value={auto.id}>
                    {auto.label}
                  </option>
                ))}
              </select>
            </div>
            {formData.params && formData.params.length > 0 && (
              <div className="space-y-2">
                <label className={labelClass}>Parameters</label>
                {formData.params.map((param) => (
                  <input
                    key={param}
                    type="text"
                    placeholder={param}
                    value={formData[`param_${param}`] || ""}
                    onChange={(e) =>
                      handleChange(`param_${param}`, e.target.value)
                    }
                    className={inputClass}
                  />
                ))}
              </div>
            )}
          </>
        );

      case "endNode":
        return (
          <>
            <div>
              <label className={labelClass}>End Message</label>
              <input
                type="text"
                value={formData.label || ""}
                onChange={(e) => handleChange("label", e.target.value)}
                className={inputClass}
                placeholder="Completion message"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.showSummary || false}
                onChange={(e) => handleChange("showSummary", e.target.checked)}
                className="mr-3 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                className={`text-sm ${
                  isDark ? "text-gray-200" : "text-gray-700"
                } font-medium`}
              >
                Show workflow summary
              </label>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full w-96 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } shadow-2xl z-50 overflow-y-auto border-l`}
    >
      <div
        className={`sticky top-0 ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border-b px-6 py-4 flex justify-between items-center backdrop-blur-sm`}
      >
        <h2
          className={`text-lg font-bold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Configure Node
        </h2>
        <button
          onClick={onClose}
          className={`${
            isDark
              ? "text-gray-400 hover:text-gray-200"
              : "text-gray-400 hover:text-gray-600"
          } transition-colors`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-5">
        {renderFields()}

        <div className="flex gap-3 pt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg transition-all"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-3 border ${
              isDark
                ? "border-gray-600 hover:bg-gray-700 text-gray-200"
                : "border-gray-300 hover:bg-gray-50 text-gray-700"
            } rounded-lg font-medium transition-all`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Export Menu Component
const ExportMenu = ({ onExport, onClose, isDark }) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={`${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className={`text-xl font-bold ${
            isDark ? "text-white" : "text-gray-900"
          } mb-4`}
        >
          Export Workflow
        </h3>
        <div className="space-y-3">
          <button
            onClick={() => onExport("json")}
            className={`w-full flex items-center gap-3 px-4 py-3 ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            } rounded-lg font-medium transition-all`}
          >
            <FileJson className="w-5 h-5" />
            Export as JSON
          </button>
          <button
            onClick={() => onExport("jpeg")}
            className={`w-full flex items-center gap-3 px-4 py-3 ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            } rounded-lg font-medium transition-all`}
          >
            <Download className="w-5 h-5" />
            Export as JPEG
          </button>
          <button
            onClick={() => onExport("pdf")}
            className={`w-full flex items-center gap-3 px-4 py-3 ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            } rounded-lg font-medium transition-all`}
          >
            <Download className="w-5 h-5" />
            Export as PDF
          </button>
        </div>
        <button
          onClick={onClose}
          className={`w-full mt-4 px-4 py-2 border ${
            isDark
              ? "border-gray-600 hover:bg-gray-700 text-gray-200"
              : "border-gray-300 hover:bg-gray-50 text-gray-700"
          } rounded-lg font-medium transition-all`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Main Flow Component
const FlowCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [workflowTitle, setWorkflowTitle] = useState("HR Workflow Designer");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const { getNodes } = useReactFlow();
  const flowRef = useRef(null);

  const nodeTypes = useMemo(
    () => ({
      startNode: (props) => <StartNode {...props} isDark={isDark} />,
      taskNode: (props) => <TaskNode {...props} isDark={isDark} />,
      approvalNode: (props) => <ApprovalNode {...props} isDark={isDark} />,
      automatedNode: (props) => <AutomatedNode {...props} isDark={isDark} />,
      endNode: (props) => <EndNode {...props} isDark={isDark} />,
    }),
    [isDark]
  );

  React.useEffect(() => {
    mockAPI.getAutomations().then(setAutomations);

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 3, stroke: isDark ? "#818cf8" : "#6366f1" },
          },
          eds
        )
      );
    },
    [isDark]
  );

  const addNode = (type) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { label: getDefaultLabel(type) },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const getDefaultLabel = (type) => {
    const labels = {
      startNode: "Start",
      taskNode: "New Task",
      approvalNode: "Approval Required",
      automatedNode: "Automated Action",
      endNode: "Complete",
    };
    return labels[type] || "Node";
  };

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const updateNodeData = (nodeId, data) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
  };

  const deleteSelected = () => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
  };

  const downloadImage = (dataUrl, extension) => {
    const a = document.createElement("a");
    a.setAttribute("download", `workflow.${extension}`);
    a.setAttribute("href", dataUrl);
    a.click();
  };

  const exportAsImage = async (format) => {
    const nodesBounds = getRectOfNodes(getNodes());
    const transform = getTransformForBounds(nodesBounds, 1920, 1080, 0.5, 2);

    const viewport = document.querySelector(".react-flow__viewport");

    if (format === "jpeg") {
      toJpeg(viewport, {
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        width: 1920,
        height: 1080,
        style: {
          width: "1920px",
          height: "1080px",
          transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
        },
      }).then((dataUrl) => {
        downloadImage(dataUrl, "jpeg");
      });
    }
  };

  const exportAsPDF = async () => {
    const nodesBounds = getRectOfNodes(getNodes());
    const transform = getTransformForBounds(nodesBounds, 1920, 1080, 0.5, 2);

    const viewport = document.querySelector(".react-flow__viewport");

    toPng(viewport, {
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      width: 1920,
      height: 1080,
      style: {
        width: "1920px",
        height: "1080px",
        transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
      },
    }).then((dataUrl) => {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1920, 1080],
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, 1920, 1080);
      pdf.save("workflow.pdf");
    });
  };

  const handleExport = async (format) => {
    setShowExportMenu(false);

    if (format === "json") {
      const workflow = { nodes, edges };
      const blob = new Blob([JSON.stringify(workflow, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "workflow.json";
      a.click();
    } else if (format === "jpeg") {
      await exportAsImage("jpeg");
    } else if (format === "pdf") {
      await exportAsPDF();
    }
  };

  const importWorkflow = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const workflow = JSON.parse(e.target.result);
        setNodes(workflow.nodes);
        setEdges(workflow.edges);
      };
      reader.readAsText(file);
    }
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    setShowSimulation(true);
    setSimulationResult(null);

    try {
      const result = await mockAPI.simulate({ nodes, edges });
      setSimulationResult(result);
    } catch (error) {
      setSimulationResult({ status: "error", message: error.message });
    } finally {
      setIsSimulating(false);
    }
  };

  const nodeLibrary = [
    {
      type: "startNode",
      label: "Start",
      icon: Circle,
      color: isDark ? "emerald-500" : "emerald-400",
    },
    {
      type: "taskNode",
      label: "Task",
      icon: CheckCircle,
      color: isDark ? "blue-500" : "blue-400",
    },
    {
      type: "approvalNode",
      label: "Approval",
      icon: AlertCircle,
      color: isDark ? "amber-500" : "amber-400",
    },
    {
      type: "automatedNode",
      label: "Automated",
      icon: Play,
      color: isDark ? "purple-500" : "purple-400",
    },
    {
      type: "endNode",
      label: "End",
      icon: Circle,
      color: isDark ? "rose-500" : "rose-400",
    },
  ];

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div
      className={`h-screen flex flex-col ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      } transition-colors duration-300`}
    >
      {/* Header */}
      <header
        className={`${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border-b px-6 py-4 shadow-lg transition-colors duration-300`}
      >
        <div className="flex items-center justify-between">
          <div>
            {isEditingTitle ? (
              <input
                type="text"
                value={workflowTitle}
                onChange={(e) => setWorkflowTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyPress={(e) =>
                  e.key === "Enter" && setIsEditingTitle(false)
                }
                className={`text-2xl font-bold ${
                  isDark
                    ? "bg-gray-700 text-white"
                    : "bg-gray-100 text-gray-900"
                } px-2 py-1 rounded border-2 border-indigo-500 focus:outline-none`}
                autoFocus
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                } bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity`}
              >
                {workflowTitle}
              </h1>
            )}
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              } mt-1`}
            >
              {nodes.length} nodes • {edges.length} connections
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`flex items-center gap-2 ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              } px-4 py-2 rounded-lg font-medium transition-all`}
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={runSimulation}
              disabled={nodes.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg transition-all"
            >
              <Play className="w-4 h-4" />
              Test Workflow
            </button>

            <button
              onClick={() => setShowExportMenu(true)}
              className={`flex items-center gap-2 ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              } px-4 py-2 rounded-lg font-medium transition-all`}
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            <label
              className={`flex items-center gap-2 ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              } px-4 py-2 rounded-lg font-medium cursor-pointer transition-all`}
            >
              <Upload className="w-4 h-4" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={importWorkflow}
                className="hidden"
              />
            </label>

            <button
              onClick={deleteSelected}
              className={`flex items-center gap-2 ${
                isDark
                  ? "bg-red-900/50 hover:bg-red-900/70 text-red-300"
                  : "bg-red-50 hover:bg-red-100 text-red-600"
              } px-4 py-2 rounded-lg font-medium transition-all`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Node Library Sidebar */}
        <aside
          className={`w-72 ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          } border-r p-6 overflow-y-auto transition-colors duration-300`}
        >
          <h3
            className={`text-sm font-bold ${
              isDark ? "text-gray-300" : "text-gray-700"
            } mb-4 uppercase tracking-wider`}
          >
            Node Library
          </h3>
          <div className="space-y-3">
            {nodeLibrary.map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => addNode(type)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-${color} ${
                  isDark
                    ? "bg-gray-700/50 hover:bg-gray-700"
                    : "bg-gray-50 hover:bg-gray-100"
                } transition-all hover:scale-105 hover:shadow-lg group`}
              >
                <Icon className={`w-5 h-5 text-${color}`} />
                <span
                  className={`font-semibold ${
                    isDark ? "text-white" : "text-gray-700"
                  }`}
                >
                  {label}
                </span>
                <Plus
                  className={`w-4 h-4 ml-auto ${
                    isDark ? "text-gray-400" : "text-gray-400"
                  } group-hover:scale-110 transition-transform`}
                />
              </button>
            ))}
          </div>

          <div
            className={`mt-8 p-4 ${
              isDark
                ? "bg-gray-700/50"
                : "bg-gradient-to-br from-indigo-50 to-purple-50"
            } rounded-xl transition-colors duration-300`}
          >
            <h4
              className={`text-xs font-bold ${
                isDark ? "text-gray-300" : "text-gray-700"
              } mb-3 uppercase tracking-wide`}
            >
              Quick Tips
            </h4>
            <ul
              className={`text-xs ${
                isDark ? "text-gray-400" : "text-gray-600"
              } space-y-2`}
            >
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span>Click nodes to configure them</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span>Drag from handles to connect</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span>Select & delete with trash</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span>Test workflows with play</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span>Export as JPEG or PDF</span>
              </li>
            </ul>
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 relative" ref={flowRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className={isDark ? "dark" : ""}
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: true,
              style: { strokeWidth: 3, stroke: isDark ? "#818cf8" : "#6366f1" },
            }}
          >
            <Background
              color={isDark ? "#374151" : "#d1d5db"}
              gap={20}
              className="transition-colors duration-300"
            />
            <Controls
              className={`${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } shadow-xl rounded-lg border transition-colors duration-300`}
            />
            <MiniMap
              className={`${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } shadow-xl rounded-lg border transition-colors duration-300`}
              nodeBorderRadius={8}
              nodeColor={(node) => {
                const colors = {
                  startNode: "#10b981",
                  taskNode: "#3b82f6",
                  approvalNode: "#f59e0b",
                  automatedNode: "#a855f7",
                  endNode: "#ef4444",
                };
                return colors[node.type] || "#6b7280";
              }}
            />
          </ReactFlow>
        </main>

        {/* Insights Panel */}
        <InsightsPanel nodes={nodes} edges={edges} isDark={isDark} />
      </div>

      {/* Node Configuration Panel */}
      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onUpdate={updateNodeData}
          onClose={() => setSelectedNode(null)}
          automations={automations}
          isDark={isDark}
        />
      )}

      {/* Export Menu */}
      {showExportMenu && (
        <ExportMenu
          onExport={handleExport}
          onClose={() => setShowExportMenu(false)}
          isDark={isDark}
        />
      )}

      {/* Simulation Panel */}
      {showSimulation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border`}
          >
            <div
              className={`px-6 py-4 ${
                isDark ? "border-gray-700" : "border-gray-200"
              } border-b flex justify-between items-center`}
            >
              <h2
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Workflow Simulation
              </h2>
              <button
                onClick={() => setShowSimulation(false)}
                className={`${
                  isDark
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-400 hover:text-gray-600"
                } transition-colors`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isSimulating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 opacity-20 animate-pulse"></div>
                  </div>
                  <p
                    className={`${
                      isDark ? "text-gray-300" : "text-gray-600"
                    } mt-4 font-medium`}
                  >
                    Running simulation...
                  </p>
                </div>
              ) : simulationResult ? (
                <div className="space-y-4">
                  <div
                    className={`px-5 py-4 rounded-xl ${
                      simulationResult.status === "success"
                        ? isDark
                          ? "bg-green-900/30 text-green-300 border border-green-700"
                          : "bg-green-50 text-green-800 border border-green-200"
                        : isDark
                        ? "bg-red-900/30 text-red-300 border border-red-700"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    <p className="font-semibold text-lg">
                      {simulationResult.status === "success"
                        ? "✓ Simulation completed successfully"
                        : "✗ Simulation failed"}
                    </p>
                  </div>

                  {simulationResult.steps && (
                    <div className="space-y-3">
                      <h3
                        className={`font-bold ${
                          isDark ? "text-white" : "text-gray-900"
                        } text-lg`}
                      >
                        Execution Steps:
                      </h3>
                      {simulationResult.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-4 items-start">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                            {idx + 1}
                          </div>
                          <div
                            className={`flex-1 ${
                              isDark
                                ? "bg-gray-700/50"
                                : "bg-gradient-to-br from-gray-50 to-gray-100"
                            } p-5 rounded-xl border ${
                              isDark ? "border-gray-600" : "border-gray-200"
                            } hover:shadow-lg transition-shadow`}
                          >
                            <div
                              className={`font-bold ${
                                isDark ? "text-white" : "text-gray-900"
                              } text-lg`}
                            >
                              {step.label}
                            </div>
                            <div
                              className={`text-sm ${
                                isDark ? "text-gray-400" : "text-gray-600"
                              } mt-1 font-medium`}
                            >
                              {step.type.replace("Node", "")}
                            </div>
                            {step.details && (
                              <div
                                className={`text-sm ${
                                  isDark ? "text-gray-300" : "text-gray-700"
                                } mt-2 bg-white/5 px-3 py-2 rounded-lg`}
                              >
                                {step.details}
                              </div>
                            )}
                            <div
                              className={`text-xs ${
                                isDark ? "text-gray-500" : "text-gray-400"
                              } mt-3 font-mono`}
                            >
                              {new Date(step.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper Component with ReactFlowProvider
const HRWorkflowDesigner = () => {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
};

export default HRWorkflowDesigner;
