import { createAgentRenderer } from '~/utils/agentRenderer'

/** Exposes window.filmX to the local MCP server only while the renderer page is shown. */
export const useAgentRenderer = () => {
  const install = () => {
    window.filmX = createAgentRenderer()
  }
  const remove = () => {
    delete window.filmX
  }

  onMounted(install)
  onActivated(install)
  onDeactivated(remove)
  onBeforeUnmount(remove)
}
