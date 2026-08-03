"""Generate the unsigned Shortcut used by the free manual JSON export flow.

The file format is Apple's undocumented binary plist format. The Shortcut accepts
a JSON file from the iOS share sheet and POSTs it to SnackOverflow. Users replace
the two visible placeholders after importing it.
"""
from pathlib import Path
import plistlib
import uuid

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "shortcuts" / "snackoverflow-health-sync.shortcut"

def action(identifier, params=None):
    return {
        "WFWorkflowActionIdentifier": identifier,
        "WFWorkflowActionParameters": params or {},
        "UUID": str(uuid.uuid4()).upper(),
    }

shortcut = {
    "WFWorkflow": {
        "WFWorkflowClientRelease": "26.0",
        "WFWorkflowClientVersion": "1500.0",
        "WFWorkflowIcon": {"WFWorkflowIconStartColor": 463140863, "WFWorkflowIconGlyphNumber": 59781},
        "WFWorkflowImportQuestions": [],
        "WFWorkflowInputContentItemClasses": ["public.json", "public.file-url", "public.data"],
        "WFWorkflowMinimumClientVersion": 1300,
        "WFWorkflowMinimumClientVersionString": "1300",
        "WFWorkflowOutputContentItemClasses": [],
        "WFWorkflowHasOutputFallback": False,
        "WFWorkflowTypes": ["ActionExtension", "NCWidget"],
        "WFWorkflowHasShortcutInputVariables": True,
        "WFWorkflowActions": [
            action("is.workflow.actions.comment", {"WFCommentActionText": "Share a Health Auto Export JSON file to this Shortcut. Replace the URL and token placeholders in the next action before first use."}),
            action("is.workflow.actions.downloadurl", {
                "WFHTTPMethod": "POST",
                "WFHTTPHeaders": {
                    "Authorization": "Bearer PASTE_YOUR_SNACKOVERFLOW_TOKEN_HERE",
                    "Content-Type": "application/json",
                },
                "WFHTTPBodyType": "File",
                "WFRequestVariable": {
                    "Value": {"VariableName": "Shortcut Input", "Type": "Variable"},
                    "WFSerializationType": "WFTextTokenAttachment",
                },
                "WFURLActionURL": "https://YOUR_SNACKOVERFLOW_DOMAIN/api/health/ingest/shortcut",
            }),
            action("is.workflow.actions.notification", {"WFNotificationActionTitle": "SnackOverflow health sync sent"}),
        ],
    }
}

OUT.parent.mkdir(parents=True, exist_ok=True)
with OUT.open("wb") as handle:
    plistlib.dump(shortcut, handle, fmt=plistlib.FMT_BINARY, sort_keys=False)
print(OUT)
