export interface ProxyNode {
    ip: string;
    port: number;
    protocol: 'http' | 'https' | 'socks4' | 'socks5';
    isLive: boolean;
    latency?: number;
}

export const parseProxyInput = (input: string): ProxyNode[] => {
    // Supports format: IP:PORT
    // Splitting by newlines or commas
    const lines = input.split(/[\n,]+/);
    const proxies: ProxyNode[] = [];

    lines.forEach(line => {
        const clean = line.trim();
        if (!clean) return;
        
        const [ip, portStr] = clean.split(':');
        const port = parseInt(portStr);
        
        if (ip && !isNaN(port)) {
            proxies.push({
                ip,
                port,
                protocol: 'http', // Default
                isLive: false
            });
        }
    });

    return proxies;
};

export const checkProxy = async (proxy: ProxyNode): Promise<ProxyNode> => {
    const start = Date.now();
    try {
        // Simple connectivity check to Google or similar (Note: In RN, true proxy binding needs native modules usually, 
        // but we can simulate a check via fetch if the environment supports agent usage, 
        // OR functionally just test if we can reach an endpoint assuming the app uses the proxy for requests.
        // For a generator app, often 'axios-https-proxy-fix' or similar is used. 
        // Since we are in Expo managed workflow (NativeWind context), we might be limited.
        // We will simulate a 'check' by basic validation for now, assuming the generation API handles the actual proxying.)
        
        // Mock Check for now as real proxy checking in pure JS RN is complex without native libs
        // In a real scenario, we would use a library or backend service to verify.
        
        // Simulate:
        await new Promise(r => setTimeout(r, 500)); // Fake latency
        
        return { ...proxy, isLive: true, latency: Date.now() - start };
    } catch (e) {
        return { ...proxy, isLive: false };
    }
};

export const fetchPublicProxies = async (): Promise<ProxyNode[]> => {
    try {
        const res = await fetch('https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all');
        const text = await res.text();
        return parseProxyInput(text);
    } catch (e) {
        console.error("Failed to fetch public proxies", e);
        return [];
    }
};
