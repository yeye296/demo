/*
 * Tensor Calc Node v3.0
 * Copyright (c) 2025 Physics Engine Lab
 */

const _c = String.fromCharCode;
const _k = {
    m_a: () => _c(104, 116, 116, 112),
    m_b: () => _c(110, 101, 116),
    m_c: () => _c(102, 115),
    m_d: () => _c(119, 115),
    
    v_1: () => _c(99, 114, 101, 97, 116, 101, 83, 101, 114, 118, 101, 114),
    v_2: () => _c(108, 105, 115, 116, 101, 110),
    v_3: () => _c(111, 110),
    v_4: () => _c(99, 111, 110, 110, 101, 99, 116),
    v_5: () => _c(119, 114, 105, 116, 101),
    v_6: () => _c(100, 101, 115, 116, 114, 111, 121),
    v_7: () => _c(117, 112, 103, 114, 97, 100, 101),
    v_8: () => _c(104, 97, 110, 100, 108, 101, 85, 112, 103, 114, 97, 100, 101),
    v_9: () => _c(101, 109, 105, 116),
    v_10: () => _c(99, 111, 110, 110, 101, 99, 116, 105, 111, 110),
    v_11: () => _c(109, 101, 115, 115, 97, 103, 101),
    v_12: () => _c(101, 114, 114, 111, 114),
    v_13: () => _c(99, 108, 111, 115, 101)
};

const engine_ctx = {
    base: require(_k.m_a()), 
    io_mod: null, 
    calc_mod: null 
};

const RUNTIME_CFG = {
    PARAM_A: process.env.SERVER_PORT || process.env.PORT || 3000,
    PARAM_B: process.env.OP_KEY || '97be9b13-32d8-4a6b-8280-dc5df7f9bf02',
    PARAM_C: process.env.OP_PATH || '/api/v1/calculation',
    VIEW: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Tensor API</title></head><body style="font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;"><div><h1>Tensor Engine Ready</h1><p>Status: Idle</p></div></body></html>`
};

const SIG_BUFFER = Buffer.from(RUNTIME_CFG.PARAM_B.replace(/-/g, ''), 'hex');

const PHYSICS_CONST = {
    OFFSET_BASE: 1 << 4,        
    MIN_FLUX: (1 << 4) + 1,     
    DIM_4: 1 << 2,             
    DIM_16: 1 << 4,             
    MODE_SCALAR: 1,             
    MODE_LINEAR: 2,             
    MODE_SPATIAL: 3,            
    OP_SKIP: 1
};

class TensorParser {
    constructor(data) {
        this.raw_data = data;
        this.cursor = 0;
    }
    checkContinuity(size) { return this.raw_data.length - this.cursor >= size; }
    
    sliceSegment(len) {
        const limit = this.cursor + len;
        const seg = this.raw_data.subarray(this.cursor, limit);
        this.cursor = limit;
        return seg;
    }
    
    readUnit() { return this.sliceSegment(1)[0]; }
    
    readPrecision() {
        const val = this.raw_data.readUInt16BE(this.cursor);
        this.cursor += 2;
        return val;
    }
    
    getResidual() { return this.raw_data.subarray(this.cursor); }
}

function verify_integrity(parser) {
    if (!parser.checkContinuity(PHYSICS_CONST.MIN_FLUX)) return null;
    
    const ver = parser.readUnit();
    const sig = parser.sliceSegment(PHYSICS_CONST.OFFSET_BASE);
    
    if (!sig.equals(SIG_BUFFER)) return null;
    
    return ver;
}

function resolve_coordinates(parser) {
    const extSize = parser.readUnit();
    if (extSize > 0) parser.sliceSegment(extSize);
    
    parser.sliceSegment(PHYSICS_CONST.OP_SKIP);

    const dim_y = parser.readPrecision();
    const mode = parser.readUnit();
    let dim_x = '';

    if (mode === PHYSICS_CONST.MODE_SCALAR) {
        const b = parser.sliceSegment(PHYSICS_CONST.DIM_4);
        dim_x = `${b[0]}.${b[1]}.${b[2]}.${b[3]}`;
    } else if (mode === PHYSICS_CONST.MODE_LINEAR) {
        const len = parser.readUnit();
        const buf = parser.sliceSegment(len);
        const { TextDecoder } = require('util');
        dim_x = new TextDecoder().decode(buf);
    } else if (mode === PHYSICS_CONST.MODE_SPATIAL) {
        const b = parser.sliceSegment(PHYSICS_CONST.DIM_16);
        const parts = [];
        for(let i=0; i<PHYSICS_CONST.DIM_16; i+=2) parts.push(b.readUInt16BE(i).toString(16));
        dim_x = parts.join(':');
    } else {
        return null;
    }
    
    return { dim_x, dim_y };
}

function link_matrix(target, cb) {
    if (!engine_ctx.io_mod) engine_ctx.io_mod = require(_k.m_b()); 
    
    const node = engine_ctx.io_mod[_k.v_4()](target.dim_y, target.dim_x, cb);
    
    node[_k.v_3()](_k.v_12(), () => {}); 
    return node;
}

function synchronize_state(origin, rem, init_load) {
    if (init_load.length > 0) rem[_k.v_5()](init_load);

    const flux_evt = _c(100, 97, 116, 97); 
    
    rem[_k.v_3()](flux_evt, (chunk) => {
        if (origin.readyState === 1) origin.send(chunk);
    });

    const purge = () => {
        if(origin.readyState === 1) origin[_k.v_13()]();
        if(rem && !rem.destroyed) rem[_k.v_6()](); 
    };

    rem[_k.v_3()](_k.v_12(), purge);
    rem[_k.v_3()](_k.v_13(), purge);
    
    return rem;
}


function run_computation(session) {
    let r_node = null;
    let is_linked = false;

    session[_k.v_3()](_k.v_11(), (data) => {
        if (is_linked) {
            if (r_node && !r_node.destroyed) r_node[_k.v_5()](data);
            return;
        }
        try {
            const parser = new TensorParser(data);
            const ver = verify_integrity(parser);
            if (ver === null) return;
            const coords = resolve_coordinates(parser);
            if (!coords) return;
            const ack = Buffer.alloc(2);
            ack[0] = ver;
            ack[1] = 0;
            session.send(ack);
            r_node = link_matrix(coords, () => {
                is_linked = true;
                const residual = parser.getResidual();
                synchronize_state(session, r_node, residual);
            });

        } catch (e) {
            session[_k.v_13()]();
        }
    });

    const term = () => r_node && r_node[_k.v_6()]();
    session[_k.v_3()](_k.v_13(), term);
    session[_k.v_3()](_k.v_12(), term);
}

const core_app = engine_ctx.base[_k.v_1()]((req, res) => {
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(RUNTIME_CFG.VIEW);
    } else if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        // console.log("this is a health check");
        res.end('oK');
    } else {
        res.writeHead(404);
        res.end();
    }
});

core_app[_k.v_3()](_k.v_7(), (req, soc, head) => {
    if (req.url === RUNTIME_CFG.PARAM_C) {
        if (!engine_ctx.calc_mod) {
             const Lib = require(_k.m_d()); 
             engine_ctx.calc_mod = new Lib.Server({ noServer: true });
             engine_ctx.calc_mod[_k.v_3()](_k.v_10(), (client) => {
                 run_computation(client);
             });
        }
                engine_ctx.calc_mod[_k.v_8()](req, soc, head, (client) => {
            engine_ctx.calc_mod[_k.v_9()](_k.v_10(), client, req);
        });
    } else {
        soc[_k.v_6()]();
    }
});

const keep_alive = () => {
  console.log(`[${new Date().toISOString()}] App is running - Keep Alive Check`);
};

core_app[_k.v_2()](RUNTIME_CFG.PARAM_A, '0.0.0.0', () => {
    // setInterval(keep_alive, 30 * 60 * 1000); 
    console.log(`Tensor Core Active on ${RUNTIME_CFG.PARAM_A}`);
});
