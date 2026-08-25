import React, { useState } from 'react';
import {
  Layout,
  Smartphone,
  Tablet,
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Check,
  Code2,
  Eye,
  FileCode,
  FolderPlus,
  Sliders,
  Move,
  Type,
  Square,
  Image as ImageIcon,
  CheckSquare,
  ToggleLeft,
  Search,
  ChevronDown,
  Layers,
  Palette,
  Bot,
  Zap,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { ProjectFile } from '../types';

export interface LayoutWidget {
  id: string;
  type: 'Column' | 'Row' | 'Box' | 'Card' | 'Text' | 'Button' | 'TextField' | 'Image' | 'Switch' | 'Checkbox' | 'Spacer';
  label?: string;
  text?: string;
  placeholder?: string;
  modifier?: {
    fillMaxWidth?: boolean;
    padding?: number;
    backgroundColor?: string;
    cornerRadius?: number;
    elevation?: number;
    alignment?: 'start' | 'center' | 'end';
  };
  children?: LayoutWidget[];
}

interface LayoutDesignerTabProps {
  files: ProjectFile[];
  onAddFileToSandbox?: (file: ProjectFile) => void;
  onSelectTab?: (tab: string) => void;
}

const DEFAULT_LOGIN_COMPOSE_TREE: LayoutWidget = {
  id: 'root-column',
  type: 'Column',
  modifier: {
    fillMaxWidth: true,
    padding: 24,
    backgroundColor: '#0d1117',
    alignment: 'center'
  },
  children: [
    {
      id: 'icon-hero',
      type: 'Box',
      modifier: {
        cornerRadius: 16,
        padding: 16,
        backgroundColor: '#1f6feb',
        alignment: 'center'
      },
      children: [
        {
          id: 'title-icon',
          type: 'Text',
          text: '⚡ UMAKRAFT',
          modifier: {
            padding: 4
          }
        }
      ]
    },
    {
      id: 'sp-1',
      type: 'Spacer',
      modifier: { padding: 8 }
    },
    {
      id: 'title-heading',
      type: 'Text',
      text: 'Welcome Back, Developer',
      modifier: {
        padding: 4
      }
    },
    {
      id: 'sub-heading',
      type: 'Text',
      text: 'Sign in to access your native Android workspace',
      modifier: {
        padding: 2
      }
    },
    {
      id: 'sp-2',
      type: 'Spacer',
      modifier: { padding: 12 }
    },
    {
      id: 'input-email',
      type: 'TextField',
      label: 'Email Address',
      placeholder: 'dev@umakraft.io',
      modifier: {
        fillMaxWidth: true,
        cornerRadius: 12
      }
    },
    {
      id: 'sp-3',
      type: 'Spacer',
      modifier: { padding: 8 }
    },
    {
      id: 'input-password',
      type: 'TextField',
      label: 'Security Key / Password',
      placeholder: '••••••••••••',
      modifier: {
        fillMaxWidth: true,
        cornerRadius: 12
      }
    },
    {
      id: 'sp-4',
      type: 'Spacer',
      modifier: { padding: 12 }
    },
    {
      id: 'btn-signin',
      type: 'Button',
      text: 'Launch Studio & Compile',
      modifier: {
        fillMaxWidth: true,
        padding: 12,
        backgroundColor: '#238636',
        cornerRadius: 12
      }
    }
  ]
};

const DEFAULT_DASHBOARD_COMPOSE_TREE: LayoutWidget = {
  id: 'dash-root',
  type: 'Column',
  modifier: {
    fillMaxWidth: true,
    padding: 16,
    backgroundColor: '#0d1117'
  },
  children: [
    {
      id: 'header-row',
      type: 'Row',
      modifier: {
        fillMaxWidth: true,
        padding: 8,
        alignment: 'center'
      },
      children: [
        {
          id: 'dash-title',
          type: 'Text',
          text: 'Project Telemetry',
          modifier: { padding: 4 }
        }
      ]
    },
    {
      id: 'card-metrics',
      type: 'Card',
      modifier: {
        fillMaxWidth: true,
        padding: 16,
        backgroundColor: '#161b22',
        cornerRadius: 16,
        elevation: 4
      },
      children: [
        {
          id: 'metric-label',
          type: 'Text',
          text: '⚡ Active Coroutine Workers: 12',
          modifier: { padding: 4 }
        },
        {
          id: 'metric-status',
          type: 'Text',
          text: '● Status: High Throughput / Scoped Storage Safe',
          modifier: { padding: 4 }
        }
      ]
    },
    {
      id: 'sp-5',
      type: 'Spacer',
      modifier: { padding: 8 }
    },
    {
      id: 'btn-quick-run',
      type: 'Button',
      text: 'Trigger CI/CD Gradle Pipeline',
      modifier: {
        fillMaxWidth: true,
        backgroundColor: '#1f6feb',
        cornerRadius: 12,
        padding: 10
      }
    }
  ]
};

export const LayoutDesignerTab: React.FC<LayoutDesignerTabProps> = ({
  files,
  onAddFileToSandbox,
  onSelectTab
}) => {
  const [targetFramework, setTargetFramework] = useState<'compose' | 'xml'>('compose');
  const [deviceFrame, setDeviceFrame] = useState<'phone' | 'tablet'>('phone');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [viewMode, setViewMode] = useState<'split' | 'visual' | 'code'>('split');
  
  const [layoutTree, setLayoutTree] = useState<LayoutWidget>(DEFAULT_LOGIN_COMPOSE_TREE);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>('root-column');
  const [copied, setCopied] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  // Helper to generate Kotlin Jetpack Compose code from tree
  const generateComposeCode = (widget: LayoutWidget, indentLevel = 0): string => {
    const indent = '    '.repeat(indentLevel);
    
    if (widget.type === 'Column') {
      const childrenCode = (widget.children || [])
        .map((c) => generateComposeCode(c, indentLevel + 1))
        .join('\n');
      return `${indent}Column(\n${indent}    modifier = Modifier\n${indent}        .fillMaxWidth()\n${indent}        .padding(${widget.modifier?.padding || 16}.dp)\n${indent}) {\n${childrenCode}\n${indent}}`;
    }

    if (widget.type === 'Row') {
      const childrenCode = (widget.children || [])
        .map((c) => generateComposeCode(c, indentLevel + 1))
        .join('\n');
      return `${indent}Row(\n${indent}    modifier = Modifier\n${indent}        .fillMaxWidth()\n${indent}        .padding(${widget.modifier?.padding || 8}.dp)\n${indent}) {\n${childrenCode}\n${indent}}`;
    }

    if (widget.type === 'Box') {
      const childrenCode = (widget.children || [])
        .map((c) => generateComposeCode(c, indentLevel + 1))
        .join('\n');
      return `${indent}Box(\n${indent}    modifier = Modifier\n${indent}        .background(Color(0xFF${(widget.modifier?.backgroundColor || '#1f6feb').replace('#', '')}), shape = RoundedCornerShape(${widget.modifier?.cornerRadius || 12}.dp))\n${indent}        .padding(${widget.modifier?.padding || 8}.dp)\n${indent}) {\n${childrenCode}\n${indent}}`;
    }

    if (widget.type === 'Card') {
      const childrenCode = (widget.children || [])
        .map((c) => generateComposeCode(c, indentLevel + 1))
        .join('\n');
      return `${indent}Card(\n${indent}    shape = RoundedCornerShape(${widget.modifier?.cornerRadius || 16}.dp),\n${indent}    colors = CardDefaults.cardColors(containerColor = Color(0xFF${(widget.modifier?.backgroundColor || '#161b22').replace('#', '')})),\n${indent}    elevation = CardDefaults.cardElevation(defaultElevation = ${widget.modifier?.elevation || 4}.dp),\n${indent}    modifier = Modifier.fillMaxWidth().padding(${widget.modifier?.padding || 8}.dp)\n${indent}) {\n${indent}    Column(modifier = Modifier.padding(16.dp)) {\n${childrenCode}\n${indent}    }\n${indent}}`;
    }

    if (widget.type === 'Text') {
      return `${indent}Text(\n${indent}    text = "${widget.text || 'Sample Label'}",\n${indent}    style = MaterialTheme.typography.bodyLarge,\n${indent}    color = Color.White\n${indent})`;
    }

    if (widget.type === 'Button') {
      return `${indent}Button(\n${indent}    onClick = { /* TODO: Trigger Action */ },\n${indent}    shape = RoundedCornerShape(${widget.modifier?.cornerRadius || 12}.dp),\n${indent}    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF${(widget.modifier?.backgroundColor || '#238636').replace('#', '')})),\n${indent}    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)\n${indent}) {\n${indent}    Text("${widget.text || 'Action Button'}", color = Color.White, fontWeight = FontWeight.Bold)\n${indent}}`;
    }

    if (widget.type === 'TextField') {
      return `${indent}OutlinedTextField(\n${indent}    value = textState,\n${indent}    onValueChange = { textState = it },\n${indent}    label = { Text("${widget.label || 'Input'}") },\n${indent}    placeholder = { Text("${widget.placeholder || ''}") },\n${indent}    shape = RoundedCornerShape(${widget.modifier?.cornerRadius || 12}.dp),\n${indent}    modifier = Modifier.fillMaxWidth()\n${indent})`;
    }

    if (widget.type === 'Spacer') {
      return `${indent}Spacer(modifier = Modifier.height(${widget.modifier?.padding || 16}.dp))`;
    }

    return `${indent}// Unknown Component`;
  };

  // Helper to generate Android Classic XML Layout
  const generateXmlCode = (widget: LayoutWidget, indentLevel = 0): string => {
    const indent = '    '.repeat(indentLevel);

    if (widget.type === 'Column') {
      const childrenXml = (widget.children || [])
        .map((c) => generateXmlCode(c, indentLevel + 1))
        .join('\n');
      return `${indent}<LinearLayout\n${indent}    xmlns:android="http://schemas.android.com/apk/res/android"\n${indent}    android:layout_width="match_parent"\n${indent}    android:layout_height="match_parent"\n${indent}    android:orientation="vertical"\n${indent}    android:padding="${widget.modifier?.padding || 16}dp"\n${indent}    android:background="${widget.modifier?.backgroundColor || '#0d1117'}">\n\n${childrenXml}\n\n${indent}</LinearLayout>`;
    }

    if (widget.type === 'Row') {
      const childrenXml = (widget.children || [])
        .map((c) => generateXmlCode(c, indentLevel + 1))
        .join('\n');
      return `${indent}<LinearLayout\n${indent}    android:layout_width="match_parent"\n${indent}    android:layout_height="wrap_content"\n${indent}    android:orientation="horizontal"\n${indent}    android:padding="${widget.modifier?.padding || 8}dp">\n${childrenXml}\n${indent}</LinearLayout>`;
    }

    if (widget.type === 'Text') {
      return `${indent}<TextView\n${indent}    android:layout_width="wrap_content"\n${indent}    android:layout_height="wrap_content"\n${indent}    android:text="${widget.text || 'Sample Label'}"\n${indent}    android:textColor="#FFFFFF"\n${indent}    android:textSize="16sp" />`;
    }

    if (widget.type === 'Button') {
      return `${indent}<com.google.android.material.button.MaterialButton\n${indent}    android:layout_width="match_parent"\n${indent}    android:layout_height="wrap_content"\n${indent}    android:text="${widget.text || 'Action Button'}"\n${indent}    android:backgroundTint="${widget.modifier?.backgroundColor || '#238636'}"\n${indent}    android:cornerRadius="${widget.modifier?.cornerRadius || 12}dp" />`;
    }

    if (widget.type === 'TextField') {
      return `${indent}<com.google.android.material.textfield.TextInputLayout\n${indent}    android:layout_width="match_parent"\n${indent}    android:layout_height="wrap_content"\n${indent}    android:hint="${widget.label || 'Input'}"\n${indent}    style="@style/Widget.MaterialComponents.TextInputLayout.OutlinedBox">\n${indent}    <com.google.android.material.textfield.TextInputEditText\n${indent}        android:layout_width="match_parent"\n${indent}        android:layout_height="wrap_content" />\n${indent}</com.google.android.material.textfield.TextInputLayout>`;
    }

    if (widget.type === 'Spacer') {
      return `${indent}<Space\n${indent}    android:layout_width="match_parent"\n${indent}    android:layout_height="${widget.modifier?.padding || 16}dp" />`;
    }

    return `${indent}<!-- Unsupported widget in XML -->`;
  };

  const getFullCode = () => {
    if (targetFramework === 'compose') {
      return `package com.umakraft.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun GeneratedScreenLayout() {
    var textState by remember { mutableStateOf("") }

${generateComposeCode(layoutTree, 1)}
}`;
    } else {
      return `<?xml version="1.0" encoding="utf-8"?>\n${generateXmlCode(layoutTree, 0)}`;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getFullCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddWidget = (type: LayoutWidget['type']) => {
    const newWidget: LayoutWidget = {
      id: `widget-${Date.now()}`,
      type,
      text: type === 'Text' ? 'New Text Component' : type === 'Button' ? 'Click Me' : undefined,
      label: type === 'TextField' ? 'Input Label' : undefined,
      placeholder: type === 'TextField' ? 'Enter text...' : undefined,
      modifier: {
        padding: 8,
        fillMaxWidth: true,
        cornerRadius: 12,
        backgroundColor: type === 'Button' ? '#1f6feb' : '#161b22'
      }
    };

    setLayoutTree((prev) => ({
      ...prev,
      children: [...(prev.children || []), newWidget]
    }));
  };

  const handleRemoveWidget = (id: string) => {
    const removeRecursive = (parent: LayoutWidget): LayoutWidget => {
      return {
        ...parent,
        children: (parent.children || [])
          .filter((c) => c.id !== id)
          .map(removeRecursive)
      };
    };
    setLayoutTree(removeRecursive(layoutTree));
  };

  const handleSaveToSandbox = () => {
    if (!onAddFileToSandbox) return;
    const isCompose = targetFramework === 'compose';
    const fileName = isCompose ? 'GeneratedScreenLayout.kt' : 'activity_custom_layout.xml';
    const filePath = isCompose
      ? 'sandbox/app/src/main/java/com/umakraft/app/ui/GeneratedScreenLayout.kt'
      : 'sandbox/app/src/main/res/layout/activity_custom_layout.xml';

    const newFile: ProjectFile = {
      name: fileName,
      path: filePath,
      language: isCompose ? 'kotlin' : 'xml',
      content: getFullCode(),
      isSandbox: true,
      storageScope: 'sandbox_user',
      category: isCompose ? 'kotlin' : 'manifest'
    };

    onAddFileToSandbox(newFile);
    setSavedSuccessMessage(`Saved layout to ${filePath}!`);
    setTimeout(() => setSavedSuccessMessage(null), 3500);
  };

  const handleAiGenerateLayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      if (aiPrompt.toLowerCase().includes('dash') || aiPrompt.toLowerCase().includes('telemetry') || aiPrompt.toLowerCase().includes('metric')) {
        setLayoutTree(DEFAULT_DASHBOARD_COMPOSE_TREE);
      } else {
        setLayoutTree(DEFAULT_LOGIN_COMPOSE_TREE);
      }
      setIsGenerating(false);
      setAiPrompt('');
    }, 800);
  };

  // Render Visual Component on Canvas
  const renderVisualNode = (widget: LayoutWidget): React.ReactNode => {
    const isSelected = selectedWidgetId === widget.id;

    if (widget.type === 'Column') {
      return (
        <div
          key={widget.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedWidgetId(widget.id);
          }}
          className={`flex flex-col gap-2 w-full transition-all rounded-xl ${
            isSelected ? 'ring-2 ring-[#58a6ff]' : ''
          }`}
          style={{
            padding: `${widget.modifier?.padding || 16}px`,
            backgroundColor: widget.modifier?.backgroundColor || 'transparent'
          }}
        >
          {(widget.children || []).map(renderVisualNode)}
        </div>
      );
    }

    if (widget.type === 'Row') {
      return (
        <div
          key={widget.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedWidgetId(widget.id);
          }}
          className={`flex flex-row items-center gap-2 w-full transition-all rounded-xl ${
            isSelected ? 'ring-2 ring-[#58a6ff]' : ''
          }`}
          style={{
            padding: `${widget.modifier?.padding || 8}px`
          }}
        >
          {(widget.children || []).map(renderVisualNode)}
        </div>
      );
    }

    if (widget.type === 'Box' || widget.type === 'Card') {
      return (
        <div
          key={widget.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedWidgetId(widget.id);
          }}
          className={`w-full transition-all group relative ${
            isSelected ? 'ring-2 ring-[#58a6ff]' : ''
          }`}
          style={{
            padding: `${widget.modifier?.padding || 12}px`,
            backgroundColor: widget.modifier?.backgroundColor || '#161b22',
            borderRadius: `${widget.modifier?.cornerRadius || 12}px`
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveWidget(widget.id);
            }}
            className="absolute top-2 right-2 p-1 rounded-md bg-[#da3633]/20 hover:bg-[#da3633] text-[#ff7b72] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-3 w-3" />
          </button>
          {(widget.children || []).map(renderVisualNode)}
        </div>
      );
    }

    if (widget.type === 'Text') {
      return (
        <div
          key={widget.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedWidgetId(widget.id);
          }}
          className={`group relative py-1 px-2 rounded-lg text-white font-medium text-sm transition-all ${
            isSelected ? 'bg-[#1f6feb]/20 ring-1 ring-[#58a6ff]' : 'hover:bg-white/5'
          }`}
        >
          <span>{widget.text}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveWidget(widget.id);
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded bg-[#da3633]/20 hover:bg-[#da3633] text-[#ff7b72] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </div>
      );
    }

    if (widget.type === 'Button') {
      return (
        <div
          key={widget.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedWidgetId(widget.id);
          }}
          className={`group relative w-full text-center py-2.5 px-4 font-bold text-xs text-white shadow-md transition-all ${
            isSelected ? 'ring-2 ring-[#58a6ff]' : ''
          }`}
          style={{
            backgroundColor: widget.modifier?.backgroundColor || '#238636',
            borderRadius: `${widget.modifier?.cornerRadius || 12}px`
          }}
        >
          <span>{widget.text}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveWidget(widget.id);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded bg-black/40 hover:bg-[#da3633] text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      );
    }

    if (widget.type === 'TextField') {
      return (
        <div
          key={widget.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedWidgetId(widget.id);
          }}
          className={`group relative w-full p-2.5 bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col gap-1 transition-all ${
            isSelected ? 'ring-2 ring-[#58a6ff]' : ''
          }`}
        >
          <span className="text-[10px] font-mono text-[#8b949e]">{widget.label}</span>
          <input
            type="text"
            readOnly
            placeholder={widget.placeholder}
            className="bg-transparent text-xs text-white placeholder-[#6e7681] focus:outline-none"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveWidget(widget.id);
            }}
            className="absolute right-2 top-2 p-1 rounded bg-[#da3633]/20 hover:bg-[#da3633] text-[#ff7b72] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      );
    }

    if (widget.type === 'Spacer') {
      return (
        <div
          key={widget.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedWidgetId(widget.id);
          }}
          className={`w-full border border-dashed border-[#30363d] rounded flex items-center justify-center text-[9px] font-mono text-[#8b949e] transition-all ${
            isSelected ? 'ring-1 ring-[#58a6ff]' : ''
          }`}
          style={{ height: `${widget.modifier?.padding || 16}px` }}
        >
          Spacer ({widget.modifier?.padding}dp)
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0d1117] text-[#c9d1d9] overflow-hidden rounded-xl border border-[#30363d]">
      {/* Top Toolbar */}
      <div className="px-3 py-2 bg-[#161b22] border-b border-[#30363d] flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-[#1f6feb] to-[#8957e5] p-0.5 shadow-md flex items-center justify-center">
            <div className="h-full w-full bg-[#0d1117] rounded-[10px] flex items-center justify-center">
              <Layout className="h-4 w-4 text-[#58a6ff]" />
            </div>
          </div>
          <div>
            <h2 className="text-xs font-black text-white font-mono flex items-center gap-2">
              <span>UI DESIGNER & COMPOSE STUDIO</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#3fb950]/30">
                LIVE
              </span>
            </h2>
          </div>
        </div>

        {/* Framework & Preview Controls */}
        <div className="flex items-center gap-2">
          {/* Framework Toggle */}
          <div className="flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d] text-xs font-mono">
            <button
              onClick={() => setTargetFramework('compose')}
              className={`px-2 py-1 rounded-md transition-colors ${
                targetFramework === 'compose'
                  ? 'bg-[#1f6feb] text-white font-bold'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Compose
            </button>
            <button
              onClick={() => setTargetFramework('xml')}
              className={`px-2 py-1 rounded-md transition-colors ${
                targetFramework === 'xml'
                  ? 'bg-[#1f6feb] text-white font-bold'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              XML Layout
            </button>
          </div>

          {/* View Mode */}
          <div className="flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d] text-xs font-mono">
            <button
              onClick={() => setViewMode('visual')}
              className={`p-1.5 rounded-md ${viewMode === 'visual' ? 'bg-[#21262d] text-white' : 'text-[#8b949e]'}`}
              title="Visual Canvas Only"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-md ${viewMode === 'split' ? 'bg-[#21262d] text-white' : 'text-[#8b949e]'}`}
              title="Split View"
            >
              <Layers className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`p-1.5 rounded-md ${viewMode === 'code' ? 'bg-[#21262d] text-white' : 'text-[#8b949e]'}`}
              title="Code View Only"
            >
              <Code2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Device Dimensions */}
          <div className="flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d] text-xs">
            <button
              onClick={() => setDeviceFrame('phone')}
              className={`p-1.5 rounded-md ${deviceFrame === 'phone' ? 'bg-[#21262d] text-white' : 'text-[#8b949e]'}`}
              title="Phone View"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDeviceFrame('tablet')}
              className={`p-1.5 rounded-md ${deviceFrame === 'tablet' ? 'bg-[#21262d] text-white' : 'text-[#8b949e]'}`}
              title="Tablet View"
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')}
              className="p-1.5 rounded-md text-[#8b949e] hover:text-white"
              title="Rotate Screen"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-mono font-bold rounded-lg border border-[#30363d] transition-all"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#3fb950]" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onAddFileToSandbox && (
            <button
              onClick={handleSaveToSandbox}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-mono font-bold rounded-lg shadow-md transition-all active:scale-95"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>Add to Workspace</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {savedSuccessMessage && (
        <div className="bg-[#238636]/20 border-b border-[#3fb950]/40 px-3 py-1.5 text-xs font-mono text-[#3fb950] flex items-center justify-between animate-in fade-in">
          <span>{savedSuccessMessage}</span>
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('coder')}
              className="underline font-bold hover:text-white flex items-center gap-1"
            >
              <span>Open in Coder</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Main Designer Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Component Palette & AI Prompt */}
        <aside className="w-56 bg-[#161b22] border-r border-[#30363d] flex flex-col flex-shrink-0 overflow-y-auto p-3 space-y-4">
          {/* AI Generator Box */}
          <div className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl space-y-2">
            <span className="text-[11px] font-bold font-mono text-white flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#bc8cff]" />
              <span>AI Layout Generator</span>
            </span>
            <form onSubmit={handleAiGenerateLayout} className="space-y-1.5">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Login screen, dashboard..."
                className="w-full bg-[#161b22] border border-[#30363d] focus:border-[#58a6ff] rounded-lg px-2 py-1.5 text-xs text-white font-mono placeholder-[#6e7681] focus:outline-none"
              />
              <button
                type="submit"
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full py-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-lg text-xs font-bold font-mono flex items-center justify-center gap-1 disabled:opacity-40"
              >
                {isGenerating ? <Zap className="h-3 w-3 animate-spin" /> : <Bot className="h-3 w-3" />}
                <span>{isGenerating ? 'Generating...' : 'Design Layout'}</span>
              </button>
            </form>
          </div>

          {/* Palette Items */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-[#8b949e] uppercase tracking-wider block">
              Widgets & Containers
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <button
                onClick={() => handleAddWidget('Text')}
                className="p-2 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff]/40 text-left flex items-center gap-1.5 text-white transition-all"
              >
                <Type className="h-3.5 w-3.5 text-[#58a6ff]" />
                <span>Text</span>
              </button>
              <button
                onClick={() => handleAddWidget('Button')}
                className="p-2 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-[#3fb950]/40 text-left flex items-center gap-1.5 text-white transition-all"
              >
                <Square className="h-3.5 w-3.5 text-[#3fb950]" />
                <span>Button</span>
              </button>
              <button
                onClick={() => handleAddWidget('TextField')}
                className="p-2 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-[#d29922]/40 text-left flex items-center gap-1.5 text-white transition-all"
              >
                <Sliders className="h-3.5 w-3.5 text-[#d29922]" />
                <span>Input</span>
              </button>
              <button
                onClick={() => handleAddWidget('Card')}
                className="p-2 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-[#bc8cff]/40 text-left flex items-center gap-1.5 text-white transition-all"
              >
                <Layers className="h-3.5 w-3.5 text-[#bc8cff]" />
                <span>Card</span>
              </button>
              <button
                onClick={() => handleAddWidget('Box')}
                className="p-2 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff]/40 text-left flex items-center gap-1.5 text-white transition-all"
              >
                <Square className="h-3.5 w-3.5 text-[#58a6ff]" />
                <span>Box</span>
              </button>
              <button
                onClick={() => handleAddWidget('Spacer')}
                className="p-2 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-[#8b949e] text-left flex items-center gap-1.5 text-white transition-all"
              >
                <Move className="h-3.5 w-3.5 text-[#8b949e]" />
                <span>Spacer</span>
              </button>
            </div>
          </div>

          {/* Quick Templates */}
          <div className="space-y-1.5 pt-2 border-t border-[#30363d]">
            <span className="text-[10px] font-mono font-bold text-[#8b949e] uppercase tracking-wider block">
              Sample Blueprints
            </span>
            <button
              onClick={() => setLayoutTree(DEFAULT_LOGIN_COMPOSE_TREE)}
              className="w-full py-1.5 px-2 bg-[#0d1117] hover:bg-[#21262d] rounded-lg border border-[#30363d] text-left text-xs font-mono text-white flex items-center justify-between"
            >
              <span>Auth Login Screen</span>
              <ArrowRight className="h-3 w-3 text-[#8b949e]" />
            </button>
            <button
              onClick={() => setLayoutTree(DEFAULT_DASHBOARD_COMPOSE_TREE)}
              className="w-full py-1.5 px-2 bg-[#0d1117] hover:bg-[#21262d] rounded-lg border border-[#30363d] text-left text-xs font-mono text-white flex items-center justify-between"
            >
              <span>Metrics Dashboard</span>
              <ArrowRight className="h-3 w-3 text-[#8b949e]" />
            </button>
          </div>
        </aside>

        {/* Center: Interactive Device Viewport */}
        {(viewMode === 'visual' || viewMode === 'split') && (
          <div className="flex-1 bg-[#0d1117] p-4 flex items-center justify-center overflow-auto">
            <div
              className={`bg-[#0d1117] border-4 border-[#30363d] rounded-[36px] shadow-2xl flex flex-col overflow-hidden transition-all duration-300 relative ${
                deviceFrame === 'phone'
                  ? orientation === 'portrait'
                    ? 'w-[320px] h-[580px]'
                    : 'w-[580px] h-[320px]'
                  : orientation === 'portrait'
                  ? 'w-[480px] h-[640px]'
                  : 'w-[640px] h-[480px]'
              }`}
            >
              {/* Phone Top Notch / Speaker */}
              <div className="w-full h-6 bg-[#161b22] border-b border-[#30363d] flex items-center justify-center relative flex-shrink-0">
                <div className="w-16 h-2 bg-[#0d1117] rounded-full" />
              </div>

              {/* Viewport Canvas Stage */}
              <div className="flex-1 overflow-y-auto p-2">
                {renderVisualNode(layoutTree)}
              </div>

              {/* Phone Bottom Pill */}
              <div className="w-full h-4 bg-[#161b22] border-t border-[#30363d] flex items-center justify-center flex-shrink-0">
                <div className="w-20 h-1 bg-[#30363d] rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* Right: Real-Time Generated Source Code */}
        {(viewMode === 'code' || viewMode === 'split') && (
          <div className="flex-1 bg-[#0d1117] border-l border-[#30363d] flex flex-col min-w-[320px] overflow-hidden">
            <div className="px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between text-xs font-mono text-[#8b949e]">
              <span className="flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-[#58a6ff]" />
                <span className="text-white font-bold">
                  {targetFramework === 'compose' ? 'GeneratedScreenLayout.kt' : 'activity_custom_layout.xml'}
                </span>
              </span>
              <span>{getFullCode().split('\n').length} lines</span>
            </div>
            <pre className="flex-1 p-3 text-xs font-mono text-[#c9d1d9] overflow-auto bg-[#0d1117] selection:bg-[#1f6feb]/30">
              <code>{getFullCode()}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
