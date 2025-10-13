var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-rIMYC4/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/utils/cors.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

// src/handlers/reservations.ts
async function getReservations(request, env) {
  try {
    const { searchParams } = new URL(request.url);
    const instrumentName = searchParams.get("instrumentName");
    let query = "SELECT * FROM reservations ORDER BY createdAt DESC";
    let params = [];
    if (instrumentName) {
      query = "SELECT * FROM reservations WHERE instrumentName = ? ORDER BY createdAt DESC";
      params = [instrumentName];
    }
    const result = await env.DB.prepare(query).bind(...params).all();
    const reservations = result.results;
    const reservationsByInstrument = {};
    reservations.forEach((reservation) => {
      if (!reservationsByInstrument[reservation.instrumentName]) {
        reservationsByInstrument[reservation.instrumentName] = {};
      }
      const slotKey = `${reservation.date}-${reservation.slot}`;
      reservationsByInstrument[reservation.instrumentName][slotKey] = {
        reserverName: reservation.reserverName,
        reserverUserId: reservation.reserverUserId,
        id: reservation.id
      };
    });
    const response = {
      success: true,
      data: reservationsByInstrument
    };
    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
      }
    });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    const response = {
      success: false,
      error: "Failed to fetch reservations"
    };
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(getReservations, "getReservations");
async function createReservation(request, env) {
  try {
    const body = await request.json();
    const { instrumentName, slot, date, reserverName, reserverUserId } = body;
    if (!instrumentName || !slot || !date || !reserverName || !reserverUserId) {
      const response = {
        success: false,
        error: "Missing required fields: instrumentName, slot, date, reserverName, reserverUserId"
      };
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"
        }
      });
    }
    const existingReservation = await env.DB.prepare(
      "SELECT * FROM reservations WHERE instrumentName = ? AND slot = ? AND date = ?"
    ).bind(instrumentName, slot, date).first();
    if (existingReservation) {
      const response = {
        success: false,
        error: "Slot is already reserved"
      };
      return new Response(JSON.stringify(response), {
        status: 409,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"
        }
      });
    }
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const result = await env.DB.prepare(`
      INSERT INTO reservations (id, instrumentName, slot, date, reserverName, reserverUserId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, instrumentName, slot, date, reserverName, reserverUserId, now, now).run();
    if (result.success) {
      const response = {
        success: true,
        data: {
          id,
          instrumentName,
          slot,
          date,
          reserverName,
          reserverUserId,
          createdAt: now,
          updatedAt: now
        }
      };
      return new Response(JSON.stringify(response), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"
        }
      });
    } else {
      throw new Error("Failed to create reservation");
    }
  } catch (error) {
    console.error("Error creating reservation:", error);
    const response = {
      success: false,
      error: "Failed to create reservation"
    };
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(createReservation, "createReservation");
async function deleteReservation(request, env, params) {
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const { reserverUserId } = body;
    if (!reserverUserId) {
      const response = {
        success: false,
        error: "User ID is required to delete reservation"
      };
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"
        }
      });
    }
    const existingReservation = await env.DB.prepare(
      "SELECT * FROM reservations WHERE id = ?"
    ).bind(id).first();
    if (!existingReservation) {
      const response = {
        success: false,
        error: "Reservation not found"
      };
      return new Response(JSON.stringify(response), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"
        }
      });
    }
    if (existingReservation.reserverUserId !== reserverUserId) {
      const response = {
        success: false,
        error: "You can only delete your own reservations"
      };
      return new Response(JSON.stringify(response), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"
        }
      });
    }
    const result = await env.DB.prepare(
      "DELETE FROM reservations WHERE id = ?"
    ).bind(id).run();
    if (result.success) {
      const response = {
        success: true,
        data: { deleted: true }
      };
      return new Response(JSON.stringify(response), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"
        }
      });
    } else {
      throw new Error("Failed to delete reservation");
    }
  } catch (error) {
    console.error("Error deleting reservation:", error);
    const response = {
      success: false,
      error: "Failed to delete reservation"
    };
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(deleteReservation, "deleteReservation");

// src/handlers/instruments.ts
var instruments = [
  { name: "MSO46B-Q000024", os: "Linux", group: "G8", ip: "10.233.67.6" },
  { name: "MSO56-Q100057", os: "Linux", group: "G8", ip: "10.233.66.244" },
  { name: "MSO58B-PQ010001", os: "Windows", group: "G8", ip: "10.233.65.193" },
  { name: "MSO54B-PQ010002", os: "Linux", group: "G8", ip: "10.233.65.195" },
  { name: "DPO71A-KR20007", os: void 0, group: "G8", ip: void 0 },
  { name: "MSO68B-B030015", os: "Windows", group: "G8", ip: "10.233.67.178" },
  { name: "MSO58B-C067209", os: void 0, group: "G8", ip: void 0 },
  { name: "MSO44B-SGVJ010550", os: "Linux", group: void 0, ip: "10.233.67.186" }
];
async function getInstruments(request, env) {
  try {
    const response = {
      success: true,
      data: instruments
    };
    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
      }
    });
  } catch (error) {
    console.error("Error fetching instruments:", error);
    const response = {
      success: false,
      error: "Failed to fetch instruments"
    };
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
}
__name(getInstruments, "getInstruments");

// src/worker.ts
var worker_default = {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders
        });
      }
      if (url.pathname === "/health") {
        return new Response(JSON.stringify({
          status: "ok",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      if (url.pathname === "/api/instruments" && request.method === "GET") {
        return await getInstruments(request, env);
      }
      if (url.pathname === "/api/reservations" && request.method === "GET") {
        return await getReservations(request, env);
      }
      if (url.pathname === "/api/reservations" && request.method === "POST") {
        return await createReservation(request, env);
      }
      if (url.pathname.startsWith("/api/reservations/") && request.method === "DELETE") {
        const id = url.pathname.split("/").pop();
        if (id) {
          return await deleteReservation(request, env, { id });
        }
      }
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  }
};

// node_modules/.pnpm/wrangler@4.42.2/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/.pnpm/wrangler@4.42.2/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-rIMYC4/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/.pnpm/wrangler@4.42.2/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-rIMYC4/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
