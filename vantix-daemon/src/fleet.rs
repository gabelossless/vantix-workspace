use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct AgentFleetEntry {
    pub name: String,
    pub role: String,
    pub status: String,
    pub last_active: String,
    pub tasks_completed: u32,
}

pub fn get_agent_fleet() -> Vec<AgentFleetEntry> {
    vec![
        AgentFleetEntry {
            name: "Orchestrator".to_string(),
            role: "Primary dispatcher".to_string(),
            status: "active".to_string(),
            last_active: "now".to_string(),
            tasks_completed: 0,
        },
        AgentFleetEntry {
            name: "CEO Agent".to_string(),
            role: "Strategy & vision".to_string(),
            status: "idle".to_string(),
            last_active: "—".to_string(),
            tasks_completed: 0,
        },
        AgentFleetEntry {
            name: "CTO Agent".to_string(),
            role: "Architecture & quality".to_string(),
            status: "idle".to_string(),
            last_active: "—".to_string(),
            tasks_completed: 0,
        },
        AgentFleetEntry {
            name: "Protocol Engineer".to_string(),
            role: "Exchange adapters".to_string(),
            status: "active".to_string(),
            last_active: "now".to_string(),
            tasks_completed: 0,
        },
        AgentFleetEntry {
            name: "Risk Quant".to_string(),
            role: "Slippage & volatility".to_string(),
            status: "active".to_string(),
            last_active: "now".to_string(),
            tasks_completed: 0,
        },
        AgentFleetEntry {
            name: "Capital RAG Engineer".to_string(),
            role: "Knowledge retrieval".to_string(),
            status: "active".to_string(),
            last_active: "now".to_string(),
            tasks_completed: 0,
        },
        AgentFleetEntry {
            name: "Terminal UX Engineer".to_string(),
            role: "Panels & data viz".to_string(),
            status: "active".to_string(),
            last_active: "now".to_string(),
            tasks_completed: 0,
        },
        AgentFleetEntry {
            name: "Data Pipeline Engineer".to_string(),
            role: "Storage & observability".to_string(),
            status: "active".to_string(),
            last_active: "now".to_string(),
            tasks_completed: 0,
        },
    ]
}
