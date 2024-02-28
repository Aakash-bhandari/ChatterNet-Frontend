
const CallAnnimation = () => {
    const style = {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    };
    return (
        <div style={{ height: "500px", width: "600px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExb3cxcmc3NmRyYjM5ODN0MjdwOGJvMWl1MDBnZGtkdXJtYXJrYWV5ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/uIJBFZoOaifHf52MER/giphy.gif" style={style} alt="" />
        </div>
    );
};

export default CallAnnimation;