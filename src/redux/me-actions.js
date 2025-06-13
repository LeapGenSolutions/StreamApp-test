import { myActions } from "./me-slice"

const setMyDetails = (details) =>{
    return (dispatch)=>{
        dispatch(myActions.setMyself(details))
    }
}

export default setMyDetails