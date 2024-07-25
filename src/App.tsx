import { useMemo, useState } from "react";

import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Button, Flex } from "antd";
import { useMount, useSetState } from "ahooks";
import ProjectInfo, { IProjectInfo } from "./ProjectInfo";
import { nanoid } from "nanoid";
import ProjectList from "./ProjectList";


interface IProjectData {
  total: number;
  current: number;
  pageSize: number;
  data: IProjectInfo[];

}

function App() {

  const [visible, setVisible] = useState(false)
  const openAddProjectModal = () => {
    setVisible(true)
  }

  const [projectData, setProjectData] = useSetState<IProjectData>({
    total: 0,
    current: 0,
    pageSize: 0,
    data: []
  })

  const getProjectData = async () => {
    try {
      const res = await invoke<IProjectData>('get_projects')
      setProjectData(res)
    } catch (error) { }
  }

  useMount(() => {
    getProjectData()
  })

  const addProject = async (values: IProjectInfo) => {
    const projectInfo = {
      id: nanoid(), // 这个 id 生成可以挪到后端生成
      ...values
    }
    await invoke('add_project', { projectInfo })
    onCancel()
    getProjectData()
  }

  const updateProject = async (values: IProjectInfo) => {
    await invoke('update_project', { projectInfo: { ...values, id: currentProjectId } })
    onCancel()
    getProjectData()
  }

  const onCancel = () => {
    setCurrentProjectId(undefined)
    setVisible(false)
  }

  const clearData = async () => {
    await invoke('clear_data')
    getProjectData()
  }

  const [currentProjectId, setCurrentProjectId] = useState<string>()
  const editProject = (id: string) => {
    setCurrentProjectId(id)
    setVisible(true)
  }

  const currentProject = useMemo(() => {
    return projectData.data.find(item => item.id === currentProjectId)
  }, [currentProjectId, projectData.data])

  return (
    <div>
      <Flex className="mb-5" justify="flex-end">
        <Button onClick={openAddProjectModal}>添加项目</Button>
        <Button onClick={clearData} >清除数据</Button>
      </Flex>
      <ProjectInfo
        initialValues={currentProject}
        open={visible}
        onOk={currentProjectId ? updateProject : addProject}
        onCancel={onCancel}
      />
      <ProjectList
        dataSource={projectData.data}
        getDataSource={getProjectData}
        editProject={editProject}
      />
    </div>
  );
}

export default App;
