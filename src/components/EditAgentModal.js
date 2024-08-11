const handleEditAgent = async (agentId, updatedAgent) => {
  console.log('Editing agent:', agentId, updatedAgent);
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/agents/${agentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fullname: updatedAgent.Fullname,
        email: updatedAgent.Email,
        tenantId: updatedAgent.TenantID
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update agent');
    }
    const updatedData = await response.json();
    setAgents(agents.map(agent => 
      agent.AgentID === agentId ? { ...agent, ...updatedData } : agent
    ));
    console.log('Agent updated successfully:', updatedData);
  } catch (error) {
    setError(error.message);
    console.error('Error updating agent:', error);
  }
};
