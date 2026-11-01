(async ()=>{
    let r = null, d = !1;
    function c(e) {
        switch(e){
            case "Default":
                return r.battery_mode_default();
            case "PeakShaver":
                return r.battery_mode_peak_shaver();
            case "Hybrid":
                return r.battery_mode_hybrid();
            case "LimitedForecast":
                return r.battery_mode_limited_forecast();
            default:
                return r.battery_mode_default();
        }
    }
    async function l() {
        if (!d) try {
            const e = await import("./energy_simulator-DBRn7QWI.js");
            await e.default(), r = e, d = !0;
        } catch (e) {
            throw console.error("Failed to load WASM in worker:", e), e;
        }
    }
    function y(e, t, a) {
        if (!r) throw new Error("WASM not initialized");
        const o = c(t), s = new Uint8Array(a);
        r.wasm_load_model(e, o, s);
    }
    function u(e, t, a, o, s, i) {
        if (!r) throw new Error("WASM not initialized");
        const n = c(i);
        return (r.wasm_is_model_loaded?.(e, n) || !1) && r.optimize_sweep_with_model ? r.optimize_sweep_with_model(e, new Float64Array(t), new Float64Array(a.solar), new Float64Array(a.wind), new Float64Array(a.load), o, s, n) : r.run_optimizer_sweep(new Float64Array(t), new Float64Array(a.solar), new Float64Array(a.wind), new Float64Array(a.load), o, s, n);
    }
    function m(e, t, a, o, s) {
        if (!r) throw new Error("WASM not initialized");
        const i = c(s);
        return r.evaluate_batch(e, t.solar, t.wind, t.load, a, i, o);
    }
    self.onmessage = async (e)=>{
        try {
            switch(e.data.type){
                case "init":
                    await l(), self.postMessage({
                        type: "ready"
                    });
                    break;
                case "load_model":
                    {
                        d || await l();
                        const { zone: t, batteryMode: a, bytes: o } = e.data;
                        y(t, a, o), self.postMessage({
                            type: "model_loaded",
                            zone: t,
                            batteryMode: a
                        });
                        break;
                    }
                case "sweep":
                    {
                        d || await l();
                        const { zone: t, targets: a, profiles: o, costs: s, config: i, mode: n } = e.data, w = u(t, a, o, s, i, n);
                        self.postMessage({
                            type: "sweep_results",
                            result: w
                        });
                        break;
                    }
                case "evaluate":
                    {
                        d || await l();
                        const { portfolios: t, profiles: a, costs: o, config: s, mode: i } = e.data, n = m(t, a, o, s, i);
                        self.postMessage({
                            type: "results",
                            results: n
                        });
                        break;
                    }
                default:
                    console.warn("Unknown message type:", e.data.type);
            }
        } catch (t) {
            const a = t instanceof Error ? t.message : String(t);
            self.postMessage({
                type: "error",
                error: a
            });
        }
    };
    l().then(()=>{
        self.postMessage({
            type: "ready"
        });
    }).catch((e)=>{
        self.postMessage({
            type: "error",
            error: `WASM initialization failed: ${e.message}`
        });
    });
})();
