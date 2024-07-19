import { Flex, Space, Table, TableColumnsType } from "antd";
import { IProjectInfo } from "./ProjectInfo";
import { DeleteOutlined, SendOutlined, SettingOutlined } from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/core";

interface ProjectListProps {
  dataSource: IProjectInfo[]
}

const ICON_STYLE: React.CSSProperties = { fontSize: 18, cursor: 'pointer' }

export default function ProjectList(props: ProjectListProps) {

  const { dataSource } = props

  const openVscode = (id: string) => {
    console.log('open vscode')
    const path = dataSource.find(item => item.id === id)?.projectPath
    if (path) {
      invoke('open_vscode', { path })
    }
  }

  const removeProject = (id: string) => {
    // console.log('remove project')
    // const newDataSource = dataSource.filter(item => item.id !== id)
    // invoke('remove_project', { id })
  }

  const columns: TableColumnsType<IProjectInfo> = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName'
    },
    {
      title: '项目路径',
      width: '20%',
      dataIndex: 'projectPath',
      key: 'projectPath'
    },
    {
      title: '操作',
      dataIndex: 'id',
      key: 'action',
      render: (id, record) => (
        <Flex gap="middle">
          <SendOutlined style={ICON_STYLE} onClick={() => openVscode(id)} />
          <SettingOutlined style={ICON_STYLE} />
          <DeleteOutlined style={ICON_STYLE} onClick={() => removeProject(id)} />
        </Flex>
      )
    }
  ]

  return (
    <Table<IProjectInfo>
      rowKey="id"
      columns={columns}
      dataSource={dataSource}
    />
  )
}