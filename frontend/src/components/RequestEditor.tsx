// // FILE: frontend/src/components/RequestEditor.tsx
// import { useRequests } from "../hooks/useRequests";
// import toast from "react-hot-toast";

// import {
//   FaChevronDown,
//   FaChevronRight,
//   FaPaperPlane,
//   FaTrash,
//   FaSave,
// } from "react-icons/fa";

// const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

// export default function RequestEditor() {
//   const {
//     activeRequest,
//     executeRequest,
//     loading,
//     updateRequest,
//     deleteRequest,
//     saveRequest,
//     setLoading,
//     setResponse,
//   } = useRequests();

//   console.log(typeof executeRequest, typeof setLoading, typeof setResponse);
//   const [headersOpen, setHeadersOpen] = useState(false);
//   const [bodyOpen, setBodyOpen] = useState(false);

//   if (!activeRequest)
//     return (
//       <div className="flex h-full items-center justify-center text-gray-500 italic">
//         Select a request from the sidebar to begin.
//       </div>
//     );

//   // const handleSend = async () => {
//   //   if (!activeRequest._id) return;
//   //   try {
//   //     await executeRequest(activeRequest._id);
//   //     toast.success("Request executed successfully 🚀");
//   //   } catch (err) {
//   //     toast.error("Failed to execute request ❌");
//   //   }
//   // };

//   console.log("executeRequest", executeRequest);
//   console.log("setResponse", setResponse);
//   console.log("setLoading", setLoading);

//   const handleSend = async () => {
//     if (!activeRequest) return;

//     const { executeRequest, setResponse, setLoading, updateRequest } = useRequests.getState();

//     if (!executeRequest || !setResponse || !setLoading) {
//       console.error("Functions missing from Zustand store");
//       return;
//     }

//     try {
//       setLoading(true);

//       if (activeRequest.isTemporary) {
//         const response = await fetch(activeRequest.url, {
//           method: activeRequest.method,
//           headers: activeRequest.headers,
//           body: activeRequest.body && activeRequest.method !== "GET" ? JSON.stringify(activeRequest.body) : undefined,
//         });
//         const data = await response.json().catch(() => null);
//         const result = { status: response.status, data };
//         setResponse(result);
//         updateRequest(activeRequest._id, { response: result });
//       } else {
//         await executeRequest(activeRequest._id);
//       }

//       toast.success("Request executed successfully 🚀");
//     } catch (err: any) {
//       console.error("Send failed:", err);
//       setResponse({ error: err.message });
//       toast.error("Failed to execute request ❌");
//     } finally {
//       setLoading(false);
//     }
//   };





//   const handleSave = async () => {
//     if (!activeRequest._id) return;
//     try {
//       await saveRequest(activeRequest._id);
//       toast.success("Request saved successfully ✅");
//     } catch (err) {
//       console.error("Save request failed:", err);
//       toast.error("Failed to save request ❌");
//     }
//   };

//   const handleDelete = async () => {
//     if (!activeRequest._id) return;
//     try {
//       await deleteRequest(activeRequest._id);
//       toast.success("Request deleted 🗑️");
//     } catch {
//       toast.error("Failed to delete request ❌");
//     }
//   };

//   return (
//     <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
//       {/* Top bar: Method, URL, Name, Buttons */}
//       <div className="flex items-center gap-2 p-3 border-b border-gray-300 dark:border-gray-700 flex-wrap">
//         {/* HTTP Method */}
//         <select
//           value={activeRequest.method}
//           className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2 py-1 rounded-md focus:outline-none"
//           onChange={(e) =>
//             updateRequest(activeRequest._id, { method: e.target.value })
//           }
//         >
//           {METHODS.map((m) => (
//             <option key={m} value={m}>
//               {m}
//             </option>
//           ))}
//         </select>

//         {/* URL */}
//         <input
//           type="text"
//           value={activeRequest.url || ""}
//           onChange={(e) =>
//             updateRequest(activeRequest._id, { url: e.target.value })
//           }
//           placeholder="Enter request URL..."
//           className="flex-1 min-w-[180px] px-3 py-1 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
//         />

//         {/* Request Name */}
//         <input
//           type="text"
//           value={activeRequest.name || ""}
//           onChange={(e) =>
//             updateRequest(activeRequest._id, { name: e.target.value })
//           }
//           placeholder="Request name"
//           className="w-44 px-2 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100"
//         />

//         {/* Action Buttons */}
//         <div className="flex items-center gap-2">
//           {/* ✅ Save button restored */}
//           <button
//             onClick={handleSave}
//             className="flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white transition"
//           >
//             <FaSave />
//             Save
//           </button>

//           <button
//             onClick={handleDelete}
//             className="flex items-center gap-2 px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white transition"
//           >
//             <FaTrash />
//             Delete
//           </button>

//           <button
//             onClick={handleSend}
//             disabled={loading}
//             className="flex items-center gap-2 px-3 py-1 rounded-md bg-brand-teal hover:bg-brand-purple text-white transition"
//           >
//             <FaPaperPlane />
//             {loading ? "Sending..." : "Send"}
//           </button>
//         </div>
//       </div>

//       {/* Headers Accordion */}
//       <AccordionSection
//         title="Headers"
//         isOpen={headersOpen}
//         onToggle={() => setHeadersOpen(!headersOpen)}
//       >
//         <HeaderEditor
//           headers={activeRequest.headers || {}}
//           requestId={activeRequest._id}
//           updateRequest={updateRequest}
//         />
//       </AccordionSection>

//       {/* Body Accordion */}
//       <AccordionSection
//         title="Body"
//         isOpen={bodyOpen}
//         onToggle={() => setBodyOpen(!bodyOpen)}
//       >
//         <BodyEditor
//           requestId={activeRequest._id}
//           body={activeRequest.body || {}}
//           updateRequest={updateRequest}
//         />
//       </AccordionSection>
//     </div>
//   );
// }

// /* ----------------------------- Accordion ----------------------------- */
// interface AccordionProps {
//   title: string;
//   isOpen: boolean;
//   onToggle: () => void;
//   children: React.ReactNode;
// }

// function AccordionSection({ title, isOpen, onToggle, children }: AccordionProps) {
//   return (
//     <div className="border-b border-gray-300 dark:border-gray-700">
//       <button
//         onClick={onToggle}
//         className="w-full flex justify-between items-center px-3 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 font-medium"
//       >
//         <span>{title}</span>
//         {isOpen ? <FaChevronDown /> : <FaChevronRight />}
//       </button>
//       {isOpen && <div className="p-3">{children}</div>}
//     </div>
//   );
// }

// /* ----------------------------- Header Editor ----------------------------- */
// interface HeaderEditorProps {
//   headers: Record<string, string>;
//   requestId: string;
//   updateRequest: (id: string, updates: Partial<any>) => void;
// }

// function HeaderEditor({ headers, requestId, updateRequest }: HeaderEditorProps) {
//   const [localHeaders, setLocalHeaders] = useState<Record<string, string>>(headers || {});

//   useEffect(() => {
//     setLocalHeaders(headers || {});
//   }, [headers]);

//   const handleChange = (key: string, value: string) => {
//     const updated = { ...localHeaders, [key]: value };
//     setLocalHeaders(updated);
//     updateRequest(requestId, { headers: updated });
//   };

//   const handleAddHeader = () => {
//     // Generate a unique key for new header
//     let newKey = "New-Header";
//     let counter = 1;
//     while (newKey in localHeaders) {
//       newKey = `New-Header-${counter++}`;
//     }

//     const updated = { ...localHeaders, [newKey]: "" };
//     setLocalHeaders(updated);
//     updateRequest(requestId, { headers: updated });
//   };


//   const handleRemoveHeader = (key: string) => {
//     const updated = { ...localHeaders };
//     delete updated[key];
//     setLocalHeaders(updated);
//     updateRequest(requestId, { headers: updated });
//   };

//   return (
//     <div>
//       {Object.entries(localHeaders).map(([key, value]) => (
//         <div key={key} className="flex items-center gap-2 mb-2">
//           <input
//             className="w-1/3 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-100"
//             value={key}
//             onChange={(e) => {
//               const newKey = e.target.value;
//               const updated = { ...localHeaders };
//               delete updated[key];
//               updated[newKey] = value;
//               setLocalHeaders(updated);
//               updateRequest(requestId, { headers: updated });
//             }}
//           />
//           <input
//             className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-100"
//             value={value}
//             onChange={(e) => handleChange(key, e.target.value)}
//           />
//           <button
//             onClick={() => handleRemoveHeader(key)}
//             className="text-red-500 hover:text-red-600"
//           >
//             ✕
//           </button>
//         </div>
//       ))}
//       <button
//         onClick={handleAddHeader}
//         className="px-2 py-1 text-sm rounded bg-brand-teal hover:bg-brand-purple text-white transition"
//       >
//         + Add Header
//       </button>
//     </div>
//   );
// }

// /* ----------------------------- Body Editor ----------------------------- */
// interface BodyEditorProps {
//   body: Record<string, any>;
//   requestId: string;
//   updateRequest: (id: string, updates: Partial<any>) => void;
// }

// function BodyEditor({ body, requestId, updateRequest }: BodyEditorProps) {
//   const [localBody, setLocalBody] = useState<string>(
//     typeof body === "string" ? body : JSON.stringify(body || {}, null, 2)
//   );

//   // Update localBody when switching to a new request
//   useEffect(() => {
//     setLocalBody(typeof body === "string" ? body : JSON.stringify(body || {}, null, 2));
//   }, [requestId]);

//   const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     const text = e.target.value;
//     setLocalBody(text);

//     // Only update request state if valid JSON
//     try {
//       const parsed = JSON.parse(text || "{}");
//       updateRequest(requestId, { body: parsed });
//     } catch {
//       // ignore invalid JSON — localBody keeps user's typing
//     }
//   };

//   return (
//     <textarea
//       className="w-full h-40 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-md p-2 resize-none"
//       value={localBody}
//       onChange={handleChange}
//     />
//   );
// }

// // FILE: frontend/src/components/RequestEditor.tsx
// import React, { useState, useEffect } from "react";
// import { useRequests, RequestItem } from "../hooks/useRequests";
// import toast from "react-hot-toast";
// import {
//   FaChevronDown,
//   FaChevronRight,
//   FaPaperPlane,
//   FaTrash,
//   FaSave,
// } from "react-icons/fa";


// const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

// export default function RequestEditor() {
//   const {
//     activeRequest,
//     executeRequest = async () => {},  // ✅ fallback noop
//     loading = false,                  // ✅ default
//     updateRequest = () => {},
//     deleteRequest = async () => {},
//     saveRequest = async () => {},
//     setLoading = () => {},
//     setResponse = () => {},
//   } = useRequests();

//   const [headersOpen, setHeadersOpen] = useState(false);
//   const [bodyOpen, setBodyOpen] = useState(false);

//   if (!activeRequest)
//     return (
//       <div className="flex h-full items-center justify-center text-gray-500 italic">
//         Select a request from the sidebar to begin.
//       </div>
//     );

//   const handleSend = async () => {
//     if (!activeRequest) return;

//     try {
//       setLoading(true);

//       if (activeRequest.isTemporary) {
//         const response = await fetch(activeRequest.url, {
//           method: activeRequest.method,
//           headers: activeRequest.headers,
//           body:
//             activeRequest.method !== "GET" && activeRequest.body
//               ? JSON.stringify(activeRequest.body)
//               : undefined,
//         });
//         const data = await response.json();
//         setResponse({ status: response.status, data });
//       } else {
//         await executeRequest(activeRequest._id);
//       }

//       toast.success("Request executed successfully 🚀");
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to execute request ❌");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSave = async () => {
//     if (!activeRequest._id) return;
//     try {
//       await saveRequest(activeRequest._id);
//       toast.success("Request saved successfully ✅");
//     } catch (err) {
//       console.error("Save request failed:", err);
//       toast.error("Failed to save request ❌");
//     }
//   };

//   const handleDelete = async () => {
//     if (!activeRequest._id) return;
//     try {
//       await deleteRequest(activeRequest._id);
//       toast.success("Request deleted 🗑️");
//     } catch {
//       toast.error("Failed to delete request ❌");
//     }
//   };

//   return (
//     <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
//       {/* Top bar */}
//       <div className="flex items-center gap-2 p-3 border-b border-gray-300 dark:border-gray-700 flex-wrap">
//         {/* Method */}
//         <select
//           value={activeRequest.method}
//           className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2 py-1 rounded-md focus:outline-none"
//           onChange={(e) =>
//             updateRequest(activeRequest._id, { method: e.target.value })
//           }
//         >
//           {METHODS.map((m) => (
//             <option key={m} value={m}>
//               {m}
//             </option>
//           ))}
//         </select>

//         {/* URL */}
//         <input
//           type="text"
//           value={activeRequest.url || ""}
//           onChange={(e) =>
//             updateRequest(activeRequest._id, { url: e.target.value })
//           }
//           placeholder="Enter request URL..."
//           className="flex-1 min-w-[180px] px-3 py-1 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
//         />

//         {/* Name */}
//         <input
//           type="text"
//           value={activeRequest.name || ""}
//           onChange={(e) =>
//             updateRequest(activeRequest._id, { name: e.target.value })
//           }
//           placeholder="Request name"
//           className="w-44 px-2 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100"
//         />

//         {/* Buttons */}
//         <div className="flex items-center gap-2">
//           <button
//             onClick={handleSave}
//             className="flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white transition"
//           >
//             <FaSave /> Save
//           </button>

//           <button
//             onClick={handleDelete}
//             className="flex items-center gap-2 px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white transition"
//           >
//             <FaTrash /> Delete
//           </button>

//           <button
//             onClick={handleSend}
//             disabled={loading}
//             className="flex items-center gap-2 px-3 py-1 rounded-md bg-brand-teal hover:bg-brand-purple text-white transition"
//           >
//             <FaPaperPlane /> {loading ? "Sending..." : "Send"}
//           </button>
//         </div>
//       </div>

//       {/* Headers & Body sections omitted for brevity */}
//     </div>
//   );
// }


// FILE: frontend/src/components/RequestEditor.tsx
// import React, { useState, useEffect } from "react";
// import { useRequests, RequestItem } from "../hooks/useRequests";
// import toast from "react-hot-toast";
// import {
//   FaChevronDown,
//   FaChevronRight,
//   FaPaperPlane,
//   FaTrash,
//   FaSave,
// } from "react-icons/fa";

// const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

// export default function RequestEditor() {
//   const {
//     activeRequest,
//     executeRequest = async () => { },
//     loading = false,
//     updateRequest = () => { },
//     deleteRequest = async () => { },
//     saveRequest = async () => { },
//     setLoading = () => { },
//     setResponse = () => { },
//   } = useRequests();

//   const [headersOpen, setHeadersOpen] = useState(false);
//   const [bodyOpen, setBodyOpen] = useState(false);

//   if (!activeRequest)
//     return (
//       <div className="flex h-full items-center justify-center text-gray-500 italic">
//         Select a request from the sidebar to begin.
//       </div>
//     );

//   const requestId = activeRequest._id || "TEMP"; // TEMP fallback for temporary requests

//   // const handleSend = async () => {
//   //   try {
//   //     setLoading(true);

//   //     if (activeRequest.isTemporary) {
//   //       const response = await fetch(activeRequest.url, {
//   //         method: activeRequest.method,
//   //         headers: activeRequest.headers,
//   //         body:
//   //           activeRequest.method !== "GET" && activeRequest.body
//   //             ? JSON.stringify(activeRequest.body)
//   //             : undefined,
//   //       });
//   //       const data = await response.json();
//   //       setResponse({ status: response.status, data });
//   //     } else {
//   //       await executeRequest(requestId);
//   //     }

//   //     toast.success("Request executed successfully 🚀");
//   //   } catch (err) {
//   //     console.error(err);
//   //     toast.error("Failed to execute request ❌");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };
//   const handleSend = async () => {
//     const req = activeRequest;
//     if (!req) return; // safety

//     setLoading(true);

//     try {
//       if (req.isTemporary) {
//         const response = await fetch(req.url, {
//           method: req.method,
//           headers: req.headers,
//           body:
//             req.method !== "GET" && req.body
//               ? JSON.stringify(req.body)
//               : undefined,
//         });

//         let data;
//         try {
//           data = await response.json();
//         } catch {
//           data = await response.text(); // fallback if response is not JSON
//         }

//         setResponse({ status: response.status, data });

//         // ✅ Success toast for temporary requests
//         toast.success("Request executed successfully 🚀");
//         return; // exit early
//       }

//       // Normal request execution
//       if (req._id) {
//         await executeRequest(req._id);
//         toast.success("Request executed successfully 🚀");
//       }
//     } catch (err) {
//       console.error(err);
//       // Only show error toast for non-temporary requests
//       if (!req.isTemporary) toast.error("Failed to execute request ❌");
//     } finally {
//       setLoading(false);
//     }
//   };




//   const handleSave = async () => {
//     if (!activeRequest._id) return toast.error("Cannot save temporary request ❌");
//     try {
//       await saveRequest(activeRequest._id);
//       toast.success("Request saved successfully ✅");
//     } catch (err) {
//       console.error("Save request failed:", err);
//       toast.error("Failed to save request ❌");
//     }
//   };

//   const handleDelete = async () => {
//     if (!activeRequest._id) return;
//     try {
//       await deleteRequest(activeRequest._id);
//       toast.success("Request deleted 🗑️");
//     } catch {
//       toast.error("Failed to delete request ❌");
//     }
//   };

//   return (
//     <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
//       {/* Top bar */}
//       <div className="flex items-center gap-2 p-3 border-b border-gray-300 dark:border-gray-700 flex-wrap">
//         <select
//           value={activeRequest.method}
//           className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2 py-1 rounded-md focus:outline-none"
//           onChange={(e) =>
//             updateRequest(requestId, { method: e.target.value })
//           }
//         >
//           {METHODS.map((m) => (
//             <option key={m} value={m}>
//               {m}
//             </option>
//           ))}
//         </select>

//         <input
//           type="text"
//           value={activeRequest.url || ""}
//           onChange={(e) =>
//             updateRequest(requestId, { url: e.target.value })
//           }
//           placeholder="Enter request URL..."
//           className="flex-1 min-w-[180px] px-3 py-1 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
//         />

//         <input
//           type="text"
//           value={activeRequest.name || ""}
//           onChange={(e) =>
//             updateRequest(requestId, { name: e.target.value })
//           }
//           placeholder="Request name"
//           className="w-44 px-2 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100"
//         />

//         <div className="flex items-center gap-2">
//           <button
//             onClick={handleSave}
//             className="flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white transition"
//           >
//             <FaSave /> Save
//           </button>

//           <button
//             onClick={handleDelete}
//             className="flex items-center gap-2 px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white transition"
//           >
//             <FaTrash /> Delete
//           </button>

//           <button
//             onClick={handleSend}
//             disabled={loading}
//             className="flex items-center gap-2 px-3 py-1 rounded-md bg-brand-teal hover:bg-brand-purple text-white transition"
//           >
//             <FaPaperPlane /> {loading ? "Sending..." : "Send"}
//           </button>
//         </div>
//       </div>

//       {/* Headers Editor */}
//       <div className="p-3 border-b border-gray-300 dark:border-gray-700">
//         <div
//           className="flex justify-between cursor-pointer"
//           onClick={() => setHeadersOpen(!headersOpen)}
//         >
//           <span>Headers</span>
//           {headersOpen ? <FaChevronDown /> : <FaChevronRight />}
//         </div>
//         {headersOpen && (
//           <HeaderEditor
//             headers={activeRequest.headers || {}}
//             requestId={requestId}
//             updateRequest={updateRequest}
//           />
//         )}
//       </div>

//       {/* Body Editor */}
//       <div className="p-3">
//         <div
//           className="flex justify-between cursor-pointer"
//           onClick={() => setBodyOpen(!bodyOpen)}
//         >
//           <span>Body</span>
//           {bodyOpen ? <FaChevronDown /> : <FaChevronRight />}
//         </div>
//         {bodyOpen && (
//           <BodyEditor
//             body={activeRequest.body || {}}
//             requestId={requestId}
//             updateRequest={updateRequest}
//           />
//         )}
//       </div>
//     </div>
//   );
// }

// /* ----------------------------- Header Editor ----------------------------- */

// interface HeaderEditorProps {
//   headers: Record<string, string>;
//   requestId: string;
//   updateRequest: (id: string, updates: Partial<any>) => void;
// }

// export function HeaderEditor({ headers, requestId, updateRequest }: HeaderEditorProps) {
//   const [localHeaders, setLocalHeaders] = useState<Record<string, string>>(headers || {});

//   // Sync local state when headers prop changes
//   useEffect(() => {
//     setLocalHeaders(headers || {});
//   }, [headers]);

//   const handleChange = (key: string, value: string) => {
//     const updated = { ...localHeaders, [key]: value };
//     setLocalHeaders(updated);
//     updateRequest(requestId, { headers: updated });
//   };

//   const handleAddHeader = () => {
//     let newKey = "New-Header";
//     let counter = 1;
//     while (newKey in localHeaders) newKey = `New-Header-${counter++}`;
//     const updated = { ...localHeaders, [newKey]: "" };
//     setLocalHeaders(updated);
//     updateRequest(requestId, { headers: updated });
//   };

//   const handleRemoveHeader = (key: string) => {
//     const updated = { ...localHeaders };
//     delete updated[key];
//     setLocalHeaders(updated);
//     updateRequest(requestId, { headers: updated });
//   };

//   return (
//     <div className="mt-2 p-2 border rounded-md bg-white dark:bg-gray-800">
//       {Object.entries(localHeaders).map(([key, value]) => (
//         <div key={key} className="flex items-center gap-2 mb-2">
//           {/* Header Key */}
//           <input
//             value={key}
//             onChange={(e) => {
//               const newKey = e.target.value;
//               const updated = { ...localHeaders };
//               delete updated[key];
//               updated[newKey] = value;
//               setLocalHeaders(updated);
//               updateRequest(requestId, { headers: updated });
//             }}
//             className="w-1/3 px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded border border-gray-300 dark:border-gray-600"
//           />

//           {/* Header Value */}
//           <input
//             value={value}
//             onChange={(e) => handleChange(key, e.target.value)}
//             className="flex-1 px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded border border-gray-300 dark:border-gray-600"
//           />

//           <button
//             onClick={() => handleRemoveHeader(key)}
//             className="px-2 py-1 text-red-600 hover:text-red-800"
//           >
//             ✕
//           </button>
//         </div>
//       ))}
//       <button
//         onClick={handleAddHeader}
//         className="mt-1 px-2 py-1 text-blue-600 hover:text-blue-800 rounded bg-gray-100 dark:bg-gray-700"
//       >
//         + Add Header
//       </button>
//     </div>
//   );
// }

// /* ----------------------------- Body Editor ----------------------------- */
// interface BodyEditorProps {
//   body: Record<string, any> | string;
//   requestId: string;
//   updateRequest: (id: string, updates: Partial<any>) => void;
// }

// export function BodyEditor({ body, requestId, updateRequest }: BodyEditorProps) {
//   const [localBody, setLocalBody] = useState<string>(
//     typeof body === "string" ? body : JSON.stringify(body || {}, null, 2)
//   );

//   useEffect(() => {
//     setLocalBody(typeof body === "string" ? body : JSON.stringify(body || {}, null, 2));
//   }, [body]);

//   const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     const text = e.target.value;
//     setLocalBody(text);
//     try {
//       const parsed = JSON.parse(text || "{}");
//       updateRequest(requestId, { body: parsed });
//     } catch {
//       // wait for valid JSON
//     }
//   };

//   return (
//     <textarea
//       value={localBody}
//       onChange={handleChange}
//       className="w-full h-40 p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-mono resize-none"
//       placeholder="Enter request body as JSON"
//     />
//   );
// }


// FILE: frontend/src/components/RequestEditor.tsx
// FILE: frontend/src/components/RequestEditor.tsx
import React from "react";
import { useRequests } from "../hooks/useRequests";
import toast from "react-hot-toast";
import { FaPaperPlane, FaTrash, FaSave } from "react-icons/fa";
import RequestTabs from "./RequestTabs";
import HeaderEditor from "./HeaderEditor";
import BodyEditor from "./BodyEditor";
import RequestContentTabs from "./RequestContentTabs";


const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;


export default function RequestEditor() {
  const {
    activeRequest,
    executeRequest = async () => { },
    loading = false,
    updateRequest = () => { },
    deleteRequest = async () => { },
    saveRequest = async () => { },
    setLoading = () => { },
    setResponse = () => { },
  } = useRequests();

  if (!activeRequest)
    return (
      <div className="flex h-full items-center justify-center text-gray-500 italic">
        Select a request from the sidebar to begin.
      </div>
    );

  const requestId = activeRequest._id || "";

  const handleSend = async () => {
    if (!activeRequest) return;
    try {
      setLoading(true);
      if (activeRequest.isTemporary) {
        const startTime = performance.now();

        const response = await fetch(activeRequest.url, {
          method: activeRequest.method,
          headers: activeRequest.headers,
          body:
            activeRequest.method !== "GET" && activeRequest.body
              ? JSON.stringify(activeRequest.body)
              : undefined,
        });

        const endTime = performance.now();
        const timeElapsed = Math.round(endTime - startTime);

        const data = await response.json();

        setResponse({
          status: response.status,
          data,
          time: timeElapsed, // add ping time here
        });
      } else {
        await executeRequest(requestId);
      }

      toast.success("Request executed successfully 🚀");
    } catch (err) {
      console.error(err);
      toast.error("Request executed with failure X");
    } finally {
      setLoading(false);
    }
  };


  const handleSave = async () => {
    if (!requestId) return;
    try {
      
      await saveRequest(requestId);
      toast.success("Request saved successfully ✅");
    } catch (err: any) {
      console.error("Save request failed:", err);
      toast.error("Save request failed: " + (err.message || "Unknown error"));
    }
  };


  const handleDelete = async () => {
    if (!requestId) return;
    try {
      await deleteRequest(requestId);
      toast.success("Request deleted 🗑️");
    } catch {
      console.error("Failed to delete request");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-300 dark:border-gray-700 flex-wrap">
        {/* Method */}
        <select
          value={activeRequest.method}
          className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2 py-1 rounded-md focus:outline-none"
          onChange={(e) =>
            updateRequest(requestId, { method: e.target.value })
          }
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* URL */}
        <input
          type="text"
          value={activeRequest.url || ""}
          onChange={(e) => updateRequest(requestId, { url: e.target.value })}
          placeholder="Enter request URL..."
          className="flex-1 min-w-[180px] px-3 py-1 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
        />

        {/* Name */}
        <input
          type="text"
          value={activeRequest.name || ""}
          onChange={(e) => updateRequest(requestId, { name: e.target.value })}
          placeholder="Request name"
          className="w-44 px-2 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100"
        />

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white transition"
          >
            <FaSave /> Save
          </button>

          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white transition"
          >
            <FaTrash /> Delete
          </button>

          <button
            onClick={handleSend}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 rounded-md bg-brand-teal hover:bg-brand-purple text-white transition"
          >
            <FaPaperPlane /> {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      {/* Tabs for Headers & Body */}
      <div className="flex flex-col p-3">
        {/* Request Content Tabs */}
        <RequestContentTabs
          headers={activeRequest.headers || {}}
          body={activeRequest.body || {}}
          requestId={requestId}
          updateRequest={updateRequest}
        />

      </div>
    </div>
  );
}




//   return (
//     <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
//       {/* Top bar */}
//       <div className="flex items-center gap-2 p-3 border-b border-gray-300 dark:border-gray-700 flex-wrap">
//         {/* Method */}
//         <select
//           value={activeRequest.method}
//           className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2 py-1 rounded-md focus:outline-none"
//           onChange={(e) =>
//             updateRequest(requestId, { method: e.target.value })
//           }
//         >
//           {METHODS.map((m) => (
//             <option key={m} value={m}>
//               {m}
//             </option>
//           ))}
//         </select>

//         {/* URL */}
//         <input
//           type="text"
//           value={activeRequest.url || ""}
//           onChange={(e) => updateRequest(requestId, { url: e.target.value })}
//           placeholder="Enter request URL..."
//           className="flex-1 min-w-[180px] px-3 py-1 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
//         />

//         {/* Name */}
//         <input
//           type="text"
//           value={activeRequest.name || ""}
//           onChange={(e) => updateRequest(requestId, { name: e.target.value })}
//           placeholder="Request name"
//           className="w-44 px-2 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100"
//         />

//         {/* Buttons */}
//         <div className="flex items-center gap-2">
//           <button
//             onClick={handleSave}
//             className="flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white transition"
//           >
//             <FaSave /> Save
//           </button>

//           <button
//             onClick={handleDelete}
//             className="flex items-center gap-2 px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white transition"
//           >
//             <FaTrash /> Delete
//           </button>

//           <button
//             onClick={handleSend}
//             disabled={loading}
//             className="flex items-center gap-2 px-3 py-1 rounded-md bg-brand-teal hover:bg-brand-purple text-white transition"
//           >
//             <FaPaperPlane /> {loading ? "Sending..." : "Send"}
//           </button>
//         </div>
//       </div>

//       {/* Headers & Body */}
//       <div className="flex flex-col gap-4 p-3">
//         {/* Headers Toggle */}
//         <div>
//           <button
//             onClick={() => setHeadersOpen(!headersOpen)}
//             className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
//           >
//             {headersOpen ? "Hide Headers" : "Show Headers"}
//           </button>
//         </div>
//         {headersOpen && activeRequest.headers && (
//           <HeaderEditor
//             headers={activeRequest.headers}
//             requestId={requestId}
//             updateRequest={updateRequest}
//           />
//         )}

//         {/* Body Toggle */}
//         <div>
//           <button
//             onClick={() => setBodyOpen(!bodyOpen)}
//             className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
//           >
//             {bodyOpen ? "Hide Body" : "Show Body"}
//           </button>
//         </div>
//         {bodyOpen && activeRequest.body && (
//           <BodyEditor
//             body={activeRequest.body}
//             requestId={requestId}
//             updateRequest={updateRequest}
//           />
//         )}
//       </div>
//     </div>
//   );
// }
